import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { NotificacoesService } from '../../notificacoes.service';
import { 
  TipoAlerta, 
  SeveridadeAlerta, 
  StatusAlerta 
} from '../../../domain/monitoramento/monitoramento.types';

/**
 * Processador de alertas baseado em regras
 * Avalia métricas e gera alertas quando necessário
 */
@Injectable()
export class ProcessadorAlertas {
  private readonly logger = new Logger(ProcessadorAlertas.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService
  ) {}

  /**
   * Processa todas as regras de alerta ativas
   */
  async processarRegras(): Promise<void> {
    const regras = await this.prisma.regraAlerta.findMany({
      where: { ativo: true },
      include: { metrica: true }
    });

    await Promise.all(regras.map(regra => this.processarRegra(regra)));
  }

  /**
   * Processa uma regra específica
   */
  private async processarRegra(regra: any): Promise<void> {
    try {
      const metricas = await this.buscarMetricas(regra);
      const violacao = await this.avaliarRegra(regra, metricas);

      if (violacao) {
        await this.criarAlerta(regra, violacao);
      } else {
        await this.resolverAlertasAtivos(regra.id);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar regra ${regra.id}: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Busca métricas relevantes para a regra
   */
  private async buscarMetricas(regra: any): Promise<any[]> {
    const intervalo = new Date();
    intervalo.setSeconds(intervalo.getSeconds() - regra.intervalo);

    return this.prisma.metrica.findMany({
      where: {
        nome: regra.metrica.nome,
        criadoEm: { gte: intervalo }
      },
      orderBy: { criadoEm: 'desc' }
    });
  }

  /**
   * Avalia uma regra com base nas métricas
   */
  private async avaliarRegra(regra: any, metricas: any[]): Promise<any | null> {
    if (!metricas.length) return null;

    switch (regra.tipo) {
      case TipoAlerta.THRESHOLD:
        return this.avaliarThreshold(regra, metricas);
      case TipoAlerta.ANOMALIA:
        return this.avaliarAnomalia(regra, metricas);
      case TipoAlerta.TENDENCIA:
        return this.avaliarTendencia(regra, metricas);
      default:
        throw new Error(`Tipo de alerta não suportado: ${regra.tipo}`);
    }
  }

  /**
   * Avalia regra do tipo threshold (limite fixo)
   */
  private avaliarThreshold(regra: any, metricas: any[]): any | null {
    const valor = metricas[0].valor;
    const condicao = this.parseCondicao(regra.condicao);

    if (this.avaliarCondicao(valor, condicao)) {
      return {
        valor,
        mensagem: `Valor ${valor} ${condicao.operador} ${condicao.limite}`
      };
    }

    return null;
  }

  /**
   * Avalia regra do tipo anomalia (desvio do padrão)
   */
  private avaliarAnomalia(regra: any, metricas: any[]): any | null {
    const atual = metricas[0].valor;
    const valores = metricas.map(m => m.valor);
    
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desvio = Math.sqrt(
      valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length
    );

    const condicao = this.parseCondicao(regra.condicao);
    const desvios = Math.abs(atual - media) / desvio;

    if (desvios > condicao.limite) {
      return {
        valor: atual,
        mensagem: `Valor ${atual} está ${desvios.toFixed(2)} desvios padrão da média ${media.toFixed(2)}`
      };
    }

    return null;
  }

  /**
   * Avalia regra do tipo tendência (crescimento/queda)
   */
  private avaliarTendencia(regra: any, metricas: any[]): any | null {
    const valores = metricas.map(m => m.valor);
    const n = valores.length;
    
    // Regressão linear simples
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += valores[i];
      sumXY += i * valores[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const condicao = this.parseCondicao(regra.condicao);

    if (this.avaliarCondicao(slope, condicao)) {
      return {
        valor: valores[n - 1],
        mensagem: `Tendência de ${slope > 0 ? 'crescimento' : 'queda'} detectada (${slope.toFixed(2)} por período)`
      };
    }

    return null;
  }

  /**
   * Parse da condição em string para objeto
   */
  private parseCondicao(condicao: string): { operador: string; limite: number } {
    const match = condicao.match(/([><=]+)\s*(-?\d+\.?\d*)/);
    if (!match) throw new Error(`Condição inválida: ${condicao}`);

    return {
      operador: match[1],
      limite: parseFloat(match[2])
    };
  }

  /**
   * Avalia uma condição numérica
   */
  private avaliarCondicao(valor: number, condicao: { operador: string; limite: number }): boolean {
    switch (condicao.operador) {
      case '>':
        return valor > condicao.limite;
      case '>=':
        return valor >= condicao.limite;
      case '<':
        return valor < condicao.limite;
      case '<=':
        return valor <= condicao.limite;
      case '==':
        return valor === condicao.limite;
      case '!=':
        return valor !== condicao.limite;
      default:
        throw new Error(`Operador não suportado: ${condicao.operador}`);
    }
  }

  /**
   * Cria um novo alerta
   */
  private async criarAlerta(regra: any, violacao: any): Promise<void> {
    // Verificar se já existe alerta ativo
    const alertaAtivo = await this.prisma.alerta.findFirst({
      where: {
        regraId: regra.id,
        status: StatusAlerta.ATIVO
      }
    });

    if (!alertaAtivo) {
      // Criar novo alerta
      const alerta = await this.prisma.alerta.create({
        data: {
          regraId: regra.id,
          status: StatusAlerta.ATIVO,
          valor: violacao.valor,
          mensagem: violacao.mensagem
        }
      });

      // Notificar interessados
      await this.notificarAlerta(regra, alerta);
    }
  }

  /**
   * Resolve alertas ativos de uma regra
   */
  private async resolverAlertasAtivos(regraId: string): Promise<void> {
    await this.prisma.alerta.updateMany({
      where: {
        regraId,
        status: StatusAlerta.ATIVO
      },
      data: {
        status: StatusAlerta.RESOLVIDO,
        resolvidoEm: new Date()
      }
    });
  }

  /**
   * Notifica interessados sobre um alerta
   */
  private async notificarAlerta(regra: any, alerta: any): Promise<void> {
    const { severidade } = regra;
    const titulo = this.getTituloAlerta(severidade, regra.nome);
    const mensagem = this.getMensagemAlerta(regra, alerta);

    for (const destino of regra.notificar) {
      try {
        await this.notificacoes.enviar({
          tipo: 'ALERTA',
          destino,
          titulo,
          mensagem,
          prioridade: this.getPrioridadeNotificacao(severidade),
          dados: {
            regraId: regra.id,
            alertaId: alerta.id,
            severidade,
            valor: alerta.valor
          }
        });
      } catch (error) {
        this.logger.error(
          `Erro ao notificar ${destino} sobre alerta ${alerta.id}: ${error.message}`
        );
      }
    }
  }

  private getTituloAlerta(severidade: SeveridadeAlerta, nome: string): string {
    const prefixo = {
      [SeveridadeAlerta.CRITICAL]: '🔴 CRÍTICO',
      [SeveridadeAlerta.ERROR]: '🟡 ERRO',
      [SeveridadeAlerta.WARNING]: '🟠 ALERTA',
      [SeveridadeAlerta.INFO]: '🔵 INFO'
    }[severidade];

    return `${prefixo} - ${nome}`;
  }

  private getMensagemAlerta(regra: any, alerta: any): string {
    return `
      Regra: ${regra.nome}
      Severidade: ${regra.severidade}
      Métrica: ${regra.metrica.nome}
      Condição: ${regra.condicao}
      Violação: ${alerta.mensagem}
      Data: ${new Date().toLocaleString()}
    `.trim();
  }

  private getPrioridadeNotificacao(severidade: SeveridadeAlerta): string {
    return {
      [SeveridadeAlerta.CRITICAL]: 'ALTA',
      [SeveridadeAlerta.ERROR]: 'ALTA',
      [SeveridadeAlerta.WARNING]: 'MEDIA',
      [SeveridadeAlerta.INFO]: 'BAIXA'
    }[severidade];
  }
}
