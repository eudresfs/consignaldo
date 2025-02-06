import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../cache.service';
import { EmailProvider, SmsProvider, PushProvider, WhatsAppProvider, WebhookProvider } from './providers';
import { 
  Notificacao, Template, Webhook, Agendamento,
  TipoNotificacao, StatusNotificacao, StatusTemplate,
  NotificacaoProvider
} from '../../domain/notificacoes/notificacoes.types';
import { CriarNotificacaoDto, CriarTemplateDto, CriarWebhookDto, CriarAgendamentoDto } from '../../controllers/notificacoes/notificacoes.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as cronParser from 'cron-parser';

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);
  private readonly providers: Map<TipoNotificacao, NotificacaoProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
    private readonly pushProvider: PushProvider,
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly webhookProvider: WebhookProvider
  ) {
    this.providers = new Map([
      [TipoNotificacao.EMAIL, emailProvider],
      [TipoNotificacao.SMS, smsProvider],
      [TipoNotificacao.PUSH, pushProvider],
      [TipoNotificacao.WHATSAPP, whatsappProvider],
      [TipoNotificacao.WEBHOOK, webhookProvider]
    ]);
  }

  /**
   * Cria uma nova notificação
   */
  async criarNotificacao(dto: CriarNotificacaoDto): Promise<Notificacao> {
    // Valida template se fornecido
    if (dto.templateId) {
      const template = await this.prisma.templateNotificacao.findUnique({
        where: { id: dto.templateId }
      });
      if (!template) {
        throw new NotFoundException('Template não encontrado');
      }
      if (template.tipo !== dto.tipo) {
        throw new BadRequestException('Tipo de notificação incompatível com o template');
      }
    }

    // Cria a notificação
    const notificacao = await this.prisma.notificacao.create({
      data: {
        ...dto,
        status: StatusNotificacao.PENDENTE
      },
      include: {
        template: true
      }
    });

    // Se não estiver agendada, envia imediatamente
    if (!dto.agendadoPara) {
      await this.processarNotificacao(notificacao);
    }

    return notificacao;
  }

  /**
   * Processa uma notificação
   */
  private async processarNotificacao(notificacao: Notificacao): Promise<void> {
    const provider = this.providers.get(notificacao.tipo);
    if (!provider) {
      throw new BadRequestException(`Provedor não encontrado para o tipo ${notificacao.tipo}`);
    }

    try {
      // Atualiza status para ENVIANDO
      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: {
          status: StatusNotificacao.ENVIANDO,
          tentativas: { increment: 1 },
          ultimaTentativa: new Date()
        }
      });

      // Envia a notificação
      await provider.enviar(notificacao);

      // Atualiza status para ENVIADO
      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: {
          status: StatusNotificacao.ENVIADO,
          enviadoEm: new Date()
        }
      });

      // Registra no histórico
      await this.prisma.historicoNotificacao.create({
        data: {
          notificacaoId: notificacao.id,
          status: StatusNotificacao.ENVIADO,
          tentativa: notificacao.tentativas + 1
        }
      });
    } catch (erro) {
      // Atualiza status para ERRO
      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: {
          status: StatusNotificacao.ERRO,
          erro: erro.message
        }
      });

      // Registra no histórico
      await this.prisma.historicoNotificacao.create({
        data: {
          notificacaoId: notificacao.id,
          status: StatusNotificacao.ERRO,
          tentativa: notificacao.tentativas + 1,
          erro: erro.message,
          dados: { stack: erro.stack }
        }
      });

      throw erro;
    }
  }

  /**
   * Lista notificações com filtros
   */
  async listarNotificacoes(
    tipo?: TipoNotificacao,
    inicio?: Date,
    fim?: Date,
    limite = 10,
    offset = 0
  ): Promise<{ total: number; items: Notificacao[] }> {
    const where = {
      ...(tipo && { tipo }),
      ...(inicio && fim && {
        criadoEm: {
          gte: inicio,
          lte: fim
        }
      })
    };

    const [total, items] = await Promise.all([
      this.prisma.notificacao.count({ where }),
      this.prisma.notificacao.findMany({
        where,
        include: {
          template: true
        },
        orderBy: { criadoEm: 'desc' },
        take: limite,
        skip: offset
      })
    ]);

    return { total, items };
  }

  /**
   * Cria um novo template
   */
  async criarTemplate(dto: CriarTemplateDto): Promise<Template> {
    // Verifica se já existe template com mesmo nome
    const existente = await this.prisma.templateNotificacao.findFirst({
      where: { nome: dto.nome }
    });
    if (existente) {
      throw new BadRequestException('Já existe um template com este nome');
    }

    return this.prisma.templateNotificacao.create({
      data: dto
    });
  }

  /**
   * Lista templates com filtros
   */
  async listarTemplates(
    tipo?: TipoNotificacao,
    status?: StatusTemplate,
    busca?: string,
    limite = 10,
    offset = 0
  ): Promise<{ total: number; items: Template[] }> {
    const where = {
      ...(tipo && { tipo }),
      ...(status && { status }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { descricao: { contains: busca, mode: 'insensitive' } }
        ]
      })
    };

    const [total, items] = await Promise.all([
      this.prisma.templateNotificacao.count({ where }),
      this.prisma.templateNotificacao.findMany({
        where,
        orderBy: { nome: 'asc' },
        take: limite,
        skip: offset
      })
    ]);

    return { total, items };
  }

  /**
   * Cria um novo webhook
   */
  async criarWebhook(dto: CriarWebhookDto): Promise<Webhook> {
    // Verifica se já existe webhook para mesma URL
    const existente = await this.prisma.webhook.findFirst({
      where: { url: dto.url }
    });
    if (existente) {
      throw new BadRequestException('Já existe um webhook para esta URL');
    }

    return this.prisma.webhook.create({
      data: dto
    });
  }

  /**
   * Lista webhooks ativos
   */
  async listarWebhooks(): Promise<Webhook[]> {
    return this.prisma.webhook.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: 'desc' }
    });
  }

  /**
   * Cria um novo agendamento
   */
  async criarAgendamento(dto: CriarAgendamentoDto): Promise<Agendamento> {
    // Valida expressão cron
    try {
      cronParser.parseExpression(dto.expressaoCron);
    } catch (erro) {
      throw new BadRequestException('Expressão cron inválida');
    }

    // Valida template
    const template = await this.prisma.templateNotificacao.findUnique({
      where: { id: dto.templateId }
    });
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }
    if (template.tipo !== dto.tipo) {
      throw new BadRequestException('Tipo de notificação incompatível com o template');
    }

    // Calcula próxima execução
    const proximaExecucao = cronParser
      .parseExpression(dto.expressaoCron)
      .next()
      .toDate();

    return this.prisma.agendamentoNotificacao.create({
      data: {
        ...dto,
        proximaExecucao
      }
    });
  }

  /**
   * Job para processar notificações agendadas
   */
  @Cron('*/5 * * * *') // A cada 5 minutos
  async processarNotificacoesAgendadas(): Promise<void> {
    const agora = new Date();

    // Busca notificações agendadas para envio
    const notificacoes = await this.prisma.notificacao.findMany({
      where: {
        status: StatusNotificacao.PENDENTE,
        agendadoPara: {
          lte: agora
        }
      },
      include: {
        template: true
      }
    });

    // Processa cada notificação
    for (const notificacao of notificacoes) {
      try {
        await this.processarNotificacao(notificacao);
      } catch (erro) {
        this.logger.error(
          `Erro ao processar notificação agendada ${notificacao.id}`,
          erro.stack
        );
      }
    }
  }

  /**
   * Job para processar agendamentos recorrentes
   */
  @Cron('*/5 * * * *') // A cada 5 minutos
  async processarAgendamentosRecorrentes(): Promise<void> {
    const agora = new Date();

    // Busca agendamentos ativos com próxima execução vencida
    const agendamentos = await this.prisma.agendamentoNotificacao.findMany({
      where: {
        ativo: true,
        proximaExecucao: {
          lte: agora
        }
      },
      include: {
        template: true
      }
    });

    // Processa cada agendamento
    for (const agendamento of agendamentos) {
      try {
        // Cria notificação
        await this.criarNotificacao({
          tipo: agendamento.tipo,
          prioridade: agendamento.dados?.prioridade || 'MEDIA',
          destinatario: agendamento.destinatario,
          titulo: agendamento.template.assunto,
          conteudo: agendamento.template.conteudo,
          templateId: agendamento.templateId,
          dados: agendamento.dados
        });

        // Calcula próxima execução
        const proximaExecucao = cronParser
          .parseExpression(agendamento.expressaoCron)
          .next()
          .toDate();

        // Atualiza agendamento
        await this.prisma.agendamentoNotificacao.update({
          where: { id: agendamento.id },
          data: {
            ultimaExecucao: agora,
            proximaExecucao
          }
        });
      } catch (erro) {
        this.logger.error(
          `Erro ao processar agendamento ${agendamento.id}`,
          erro.stack
        );
      }
    }
  }

  /**
   * Retorna estatísticas de notificações
   */
  async getEstatisticas(inicio?: Date, fim?: Date) {
    const where = {
      ...(inicio && fim && {
        criadoEm: {
          gte: inicio,
          lte: fim
        }
      })
    };

    const [
      total,
      enviadas,
      erros,
      porTipo,
      porStatus,
      tempoMedio
    ] = await Promise.all([
      this.prisma.notificacao.count({ where }),
      this.prisma.notificacao.count({
        where: { ...where, status: StatusNotificacao.ENVIADO }
      }),
      this.prisma.notificacao.count({
        where: { ...where, status: StatusNotificacao.ERRO }
      }),
      this.prisma.notificacao.groupBy({
        by: ['tipo'],
        where,
        _count: true
      }),
      this.prisma.notificacao.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      this.prisma.notificacao.aggregate({
        where: { ...where, status: StatusNotificacao.ENVIADO },
        _avg: {
          tentativas: true
        }
      })
    ]);

    return {
      total,
      enviadas,
      erros,
      taxaSucesso: total > 0 ? (enviadas / total) * 100 : 0,
      tempoMedioEnvio: tempoMedio._avg.tentativas || 0,
      porTipo: Object.fromEntries(
        porTipo.map(({ tipo, _count }) => [tipo, _count])
      ),
      porStatus: Object.fromEntries(
        porStatus.map(({ status, _count }) => [status, _count])
      )
    };
  }
}
