import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { ApiKey, WebhookConfig, LogIntegracao, FiltrosLog, MetricasUso } from '../domain/api-publica/api-publica.types';
import { PaginacaoDTO } from '../dtos/api-publica/api-publica.dto';

@Injectable()
export class ApiPublicaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criarApiKey(dados: Omit<ApiKey, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<ApiKey> {
    return this.prisma.apiKey.create({
      data: dados
    });
  }

  async buscarApiKeyPorId(id: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({
      where: { id },
      include: {
        webhooks: true
      }
    });
  }

  async buscarApiKeyPorChave(chave: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({
      where: { chave },
      include: {
        webhooks: true
      }
    });
  }

  async atualizarApiKey(id: string, dados: Partial<ApiKey>): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data: dados,
      include: {
        webhooks: true
      }
    });
  }

  async listarApiKeys(paginacao: PaginacaoDTO): Promise<{ items: ApiKey[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        skip: (paginacao.pagina - 1) * paginacao.itensPorPagina,
        take: paginacao.itensPorPagina,
        include: {
          webhooks: true
        },
        orderBy: {
          criadoEm: 'desc'
        }
      }),
      this.prisma.apiKey.count()
    ]);

    return { items, total };
  }

  async criarWebhook(apiKeyId: string, dados: Omit<WebhookConfig, 'id'>): Promise<WebhookConfig> {
    return this.prisma.webhook.create({
      data: {
        ...dados,
        apiKeyId
      }
    });
  }

  async atualizarWebhook(id: string, dados: Partial<WebhookConfig>): Promise<WebhookConfig> {
    return this.prisma.webhook.update({
      where: { id },
      data: dados
    });
  }

  async removerWebhook(id: string): Promise<void> {
    await this.prisma.webhook.delete({
      where: { id }
    });
  }

  async registrarLog(dados: Omit<LogIntegracao, 'id'>): Promise<LogIntegracao> {
    return this.prisma.logIntegracao.create({
      data: dados
    });
  }

  async buscarLogs(
    filtros: FiltrosLog,
    paginacao: PaginacaoDTO
  ): Promise<{ items: LogIntegracao[]; total: number }> {
    const where = {
      ...(filtros.apiKeyId && { apiKeyId: filtros.apiKeyId }),
      ...(filtros.endpoint && { endpoint: filtros.endpoint }),
      ...(filtros.statusCode && { statusCode: filtros.statusCode }),
      ...(filtros.ip && { ip: filtros.ip }),
      ...(filtros.dataInicio &&
        filtros.dataFim && {
          dataHora: {
            gte: filtros.dataInicio,
            lte: filtros.dataFim
          }
        })
    };

    const [items, total] = await Promise.all([
      this.prisma.logIntegracao.findMany({
        where,
        skip: (paginacao.pagina - 1) * paginacao.itensPorPagina,
        take: paginacao.itensPorPagina,
        orderBy: {
          dataHora: 'desc'
        },
        include: {
          apiKey: true
        }
      }),
      this.prisma.logIntegracao.count({ where })
    ]);

    return { items, total };
  }

  async obterMetricas(apiKeyId: string, periodo: string): Promise<MetricasUso> {
    const dataInicio = new Date();
    switch (periodo) {
      case 'hora':
        dataInicio.setHours(dataInicio.getHours() - 1);
        break;
      case 'dia':
        dataInicio.setDate(dataInicio.getDate() - 1);
        break;
      case 'semana':
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case 'mes':
        dataInicio.setMonth(dataInicio.getMonth() - 1);
        break;
    }

    const logs = await this.prisma.logIntegracao.findMany({
      where: {
        apiKeyId,
        dataHora: {
          gte: dataInicio
        }
      }
    });

    const requisicoes = logs.length;
    const erros = logs.filter(log => log.statusCode >= 400).length;
    const tempoTotal = logs.reduce((acc, log) => acc + log.tempoResposta, 0);
    const tempoMedioResposta = requisicoes > 0 ? tempoTotal / requisicoes : 0;

    const statusCodes = logs.reduce((acc, log) => {
      acc[log.statusCode] = (acc[log.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      apiKeyId,
      periodo,
      requisicoes,
      erros,
      tempoMedioResposta,
      statusCodes
    };
  }
}
