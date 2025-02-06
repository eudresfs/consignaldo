import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ProcessadorAlertas } from './alertas/processador.alertas';
import { REGRAS_DEFAULT } from './alertas/regras.default';
import { SistemaCollector } from './coletores/sistema.collector';
import { AplicacaoCollector } from './coletores/aplicacao.collector';
import { Cron } from '@nestjs/schedule';
import {
  CreateRegraAlertaDto,
  UpdateRegraAlertaDto,
  QueryMetricasDto,
  QueryAlertasDto
} from '../../controllers/monitoramento/monitoramento.dto';

@Injectable()
export class MonitoramentoService {
  private readonly logger = new Logger(MonitoramentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processadorAlertas: ProcessadorAlertas,
    private readonly sistemaCollector: SistemaCollector,
    private readonly aplicacaoCollector: AplicacaoCollector
  ) {
    this.inicializarRegrasDefault();
  }

  // Cron Jobs
  @Cron('*/1 * * * *') // A cada minuto
  async coletarMetricas() {
    try {
      await Promise.all([
        this.sistemaCollector.coletar(),
        this.aplicacaoCollector.coletar()
      ]);
    } catch (error) {
      this.logger.error('Erro ao coletar métricas:', error);
    }
  }

  @Cron('*/5 * * * *') // A cada 5 minutos
  async processarAlertas() {
    try {
      await this.processadorAlertas.processarRegras();
    } catch (error) {
      this.logger.error('Erro ao processar alertas:', error);
    }
  }

  // Métricas
  async listarMetricas(query: QueryMetricasDto) {
    const where: any = {};

    if (query.nome) {
      where.nome = { contains: query.nome };
    }

    if (query.inicio || query.fim) {
      where.criadoEm = {};
      if (query.inicio) where.criadoEm.gte = new Date(query.inicio);
      if (query.fim) where.criadoEm.lte = new Date(query.fim);
    }

    if (query.tag) {
      where.tags = { path: ['$.*.value'], string_contains: query.tag };
    }

    return this.prisma.metrica.findMany({
      where,
      take: query.limite || 50,
      orderBy: { criadoEm: 'desc' }
    });
  }

  async buscarMetrica(nome: string) {
    return this.prisma.metrica.findFirst({
      where: { nome },
      orderBy: { criadoEm: 'desc' }
    });
  }

  async historicoMetrica(nome: string, inicio: Date, fim: Date) {
    return this.prisma.metrica.findMany({
      where: {
        nome,
        criadoEm: {
          gte: inicio,
          lte: fim
        }
      },
      orderBy: { criadoEm: 'asc' }
    });
  }

  // Regras de Alerta
  async listarRegras() {
    return this.prisma.regraAlerta.findMany({
      include: { metrica: true }
    });
  }

  async criarRegra(dto: CreateRegraAlertaDto) {
    return this.prisma.regraAlerta.create({
      data: {
        ...dto,
        ativo: true
      }
    });
  }

  async atualizarRegra(id: string, dto: UpdateRegraAlertaDto) {
    return this.prisma.regraAlerta.update({
      where: { id },
      data: dto
    });
  }

  async removerRegra(id: string) {
    return this.prisma.regraAlerta.delete({
      where: { id }
    });
  }

  // Alertas
  async listarAlertas(query: QueryAlertasDto) {
    const where: any = {};

    if (query.regraId) {
      where.regraId = query.regraId;
    }

    if (query.severidade) {
      where.regra = { severidade: query.severidade };
    }

    if (query.inicio || query.fim) {
      where.criadoEm = {};
      if (query.inicio) where.criadoEm.gte = new Date(query.inicio);
      if (query.fim) where.criadoEm.lte = new Date(query.fim);
    }

    return this.prisma.alerta.findMany({
      where,
      include: { regra: true },
      take: query.limite || 50,
      orderBy: { criadoEm: 'desc' }
    });
  }

  async buscarAlerta(id: string) {
    return this.prisma.alerta.findUnique({
      where: { id },
      include: { regra: true }
    });
  }

  async resolverAlerta(id: string, observacao?: string) {
    return this.prisma.alerta.update({
      where: { id },
      data: {
        status: 'RESOLVIDO',
        resolvidoEm: new Date(),
        observacao
      }
    });
  }

  // Dashboard
  async getDashboardResumo() {
    const [
      totalMetricas,
      totalRegras,
      alertasAtivos,
      alertasUltimas24h
    ] = await Promise.all([
      this.prisma.metrica.count(),
      this.prisma.regraAlerta.count(),
      this.prisma.alerta.count({
        where: { status: 'ATIVO' }
      }),
      this.prisma.alerta.count({
        where: {
          criadoEm: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return {
      totalMetricas,
      totalRegras,
      alertasAtivos,
      alertasUltimas24h
    };
  }

  async getMetricasChave() {
    const metricas = [
      'sistema_cpu_uso',
      'sistema_memoria_percentual',
      'sistema_disco_percentual',
      'aplicacao_request_erros',
      'aplicacao_db_erros',
      'aplicacao_cache_hit_rate'
    ];

    const resultado = await Promise.all(
      metricas.map(nome =>
        this.prisma.metrica.findFirst({
          where: { nome },
          orderBy: { criadoEm: 'desc' }
        })
      )
    );

    return resultado.reduce((acc, metrica, i) => {
      if (metrica) {
        acc[metricas[i]] = metrica.valor;
      }
      return acc;
    }, {});
  }

  async getAlertasRecentes(limite: number = 10) {
    return this.prisma.alerta.findMany({
      take: limite,
      orderBy: { criadoEm: 'desc' },
      include: { regra: true }
    });
  }

  // Inicialização
  private async inicializarRegrasDefault() {
    try {
      for (const regra of REGRAS_DEFAULT) {
        const existente = await this.prisma.regraAlerta.findFirst({
          where: { nome: regra.nome }
        });

        if (!existente) {
          await this.prisma.regraAlerta.create({
            data: {
              ...regra,
              ativo: true
            }
          });
          this.logger.log(`Regra padrão criada: ${regra.nome}`);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao inicializar regras padrão:', error);
    }
  }
}
