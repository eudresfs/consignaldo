import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  IPortabilidade,
  IFiltrosPortabilidade,
  StatusPortabilidade 
} from '../domain/portabilidade/portabilidade.types';

@Injectable()
export class PortabilidadeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: Omit<IPortabilidade, 'id' | 'dataSolicitacao' | 'dataAtualizacao'>) {
    return this.prisma.portabilidade.create({
      data: {
        ...data,
        dataSolicitacao: new Date(),
        dataAtualizacao: new Date()
      },
      include: {
        contratoOrigem: true,
        bancoOrigem: true,
        bancoDestino: true,
        servidor: true,
        usuario: true
      }
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.portabilidade.findUnique({
      where: { id },
      include: {
        contratoOrigem: true,
        bancoOrigem: true,
        bancoDestino: true,
        servidor: true,
        usuario: true
      }
    });
  }

  async atualizar(id: string, data: Partial<IPortabilidade>) {
    return this.prisma.portabilidade.update({
      where: { id },
      data: {
        ...data,
        dataAtualizacao: new Date()
      },
      include: {
        contratoOrigem: true,
        bancoOrigem: true,
        bancoDestino: true,
        servidor: true,
        usuario: true
      }
    });
  }

  async atualizarStatus(
    id: string,
    status: StatusPortabilidade,
    motivoRecusa?: string,
    observacoes?: string
  ) {
    const data: any = {
      status,
      dataAtualizacao: new Date()
    };

    if (status === StatusPortabilidade.APROVADA) {
      data.dataAprovacao = new Date();
    } else if (status === StatusPortabilidade.CONCLUIDA) {
      data.dataConclusao = new Date();
    }

    if (motivoRecusa) {
      data.motivoRecusa = motivoRecusa;
    }

    if (observacoes) {
      data.observacoes = observacoes;
    }

    return this.prisma.portabilidade.update({
      where: { id },
      data,
      include: {
        contratoOrigem: true,
        bancoOrigem: true,
        bancoDestino: true,
        servidor: true,
        usuario: true
      }
    });
  }

  async listarPorFiltros(filtros: IFiltrosPortabilidade) {
    const where: Prisma.PortabilidadeWhereInput = {
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.bancoOrigemId && { bancoOrigemId: filtros.bancoOrigemId }),
      ...(filtros.bancoDestinoId && { bancoDestinoId: filtros.bancoDestinoId }),
      ...(filtros.servidorId && { servidorId: filtros.servidorId }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataSolicitacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.portabilidade.findMany({
      where,
      include: {
        contratoOrigem: true,
        bancoOrigem: true,
        bancoDestino: true,
        servidor: true,
        usuario: true
      },
      orderBy: {
        dataSolicitacao: 'desc'
      }
    });
  }

  async contarPorFiltros(filtros: IFiltrosPortabilidade) {
    const where: Prisma.PortabilidadeWhereInput = {
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.bancoOrigemId && { bancoOrigemId: filtros.bancoOrigemId }),
      ...(filtros.bancoDestinoId && { bancoDestinoId: filtros.bancoDestinoId }),
      ...(filtros.servidorId && { servidorId: filtros.servidorId }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataSolicitacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.portabilidade.count({ where });
  }

  async obterEstatisticas() {
    const [
      totalPortabilidades,
      portabilidadesPorStatus,
      portabilidadesPorBanco,
      valoresTotais
    ] = await Promise.all([
      this.prisma.portabilidade.count(),
      this.prisma.portabilidade.groupBy({
        by: ['status'],
        _count: true
      }),
      this.prisma.portabilidade.groupBy({
        by: ['bancoDestinoId'],
        _count: true
      }),
      this.prisma.portabilidade.aggregate({
        _sum: {
          valorSaldoDevedor: true,
          valorParcela: true
        },
        _avg: {
          taxaJurosAtual: true,
          taxaJurosNova: true,
          prazoRestante: true
        }
      })
    ]);

    return {
      totalPortabilidades,
      portabilidadesPorStatus,
      portabilidadesPorBanco,
      valoresTotais
    };
  }

  async buscarPortabilidadesEmProcessamento() {
    return this.prisma.portabilidade.findMany({
      where: {
        status: StatusPortabilidade.EM_PROCESSAMENTO
      },
      include: {
        contratoOrigem: true,
        bancoOrigem: true,
        bancoDestino: true,
        servidor: true
      }
    });
  }

  async buscarPorContratoOrigem(contratoOrigemId: string) {
    return this.prisma.portabilidade.findFirst({
      where: {
        contratoOrigemId,
        status: {
          in: [
            StatusPortabilidade.AGUARDANDO_ANALISE,
            StatusPortabilidade.EM_ANALISE,
            StatusPortabilidade.APROVADA,
            StatusPortabilidade.EM_PROCESSAMENTO
          ]
        }
      }
    });
  }
}
