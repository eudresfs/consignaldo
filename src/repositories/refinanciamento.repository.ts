import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { 
  StatusRefinanciamento,
  IFiltrosRefinanciamento,
  IEstatisticasRefinanciamento,
  IRefinanciamentoMetadata 
} from '../domain/refinanciamento/refinanciamento.types';

@Injectable()
export class RefinanciamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: {
    contratoId: string;
    bancoId: number;
    servidorId: number;
    usuarioId: number;
    valorContrato: number;
    valorParcela: number;
    taxaJurosAtual: number;
    taxaJurosNova: number;
    prazoTotal: number;
    parcelasPagas: number;
    saldoDevedor: number;
    status: StatusRefinanciamento;
    protocoloBanco?: string;
    metadata: IRefinanciamentoMetadata;
  }) {
    return this.prisma.refinanciamento.create({
      data: {
        ...data,
        metadata: data.metadata as any
      },
      include: {
        contrato: true,
        banco: true,
        servidor: true
      }
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.refinanciamento.findUnique({
      where: { id },
      include: {
        contrato: true,
        banco: true,
        servidor: true
      }
    });
  }

  async buscarPorContrato(contratoId: string) {
    return this.prisma.refinanciamento.findFirst({
      where: {
        contratoId,
        status: {
          in: [
            StatusRefinanciamento.AGUARDANDO_ANALISE,
            StatusRefinanciamento.EM_ANALISE,
            StatusRefinanciamento.APROVADO,
            StatusRefinanciamento.EM_PROCESSAMENTO
          ]
        }
      }
    });
  }

  async atualizar(id: string, data: {
    documentos?: string[];
    observacoes?: string;
    metadata?: IRefinanciamentoMetadata;
  }) {
    return this.prisma.refinanciamento.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata as any
      },
      include: {
        contrato: true,
        banco: true,
        servidor: true
      }
    });
  }

  async atualizarStatus(
    id: string,
    status: StatusRefinanciamento,
    motivoRecusa?: string,
    observacoes?: string
  ) {
    return this.prisma.refinanciamento.update({
      where: { id },
      data: {
        status,
        motivoRecusa,
        observacoes
      },
      include: {
        contrato: true,
        banco: true,
        servidor: true
      }
    });
  }

  async listarPorFiltros(
    filtros: IFiltrosRefinanciamento & { page?: number; limit?: number }
  ) {
    const { page = 1, limit = 10, ...where } = filtros;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.refinanciamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataCriacao: 'desc' },
        include: {
          contrato: true,
          banco: true,
          servidor: true
        }
      }),
      this.prisma.refinanciamento.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async contarPorFiltros(filtros: IFiltrosRefinanciamento) {
    return this.prisma.refinanciamento.count({
      where: filtros
    });
  }

  async obterEstatisticas(filtros: IFiltrosRefinanciamento = {}): Promise<IEstatisticasRefinanciamento> {
    const [
      total,
      totalAprovados,
      totalReprovados,
      totalEmAnalise,
      valores
    ] = await Promise.all([
      this.contarPorFiltros(filtros),
      this.contarPorFiltros({ ...filtros, status: StatusRefinanciamento.APROVADO }),
      this.contarPorFiltros({ ...filtros, status: StatusRefinanciamento.REPROVADO }),
      this.contarPorFiltros({
        ...filtros,
        status: {
          in: [
            StatusRefinanciamento.AGUARDANDO_ANALISE,
            StatusRefinanciamento.EM_ANALISE
          ]
        }
      }),
      this.prisma.refinanciamento.aggregate({
        where: {
          ...filtros,
          status: StatusRefinanciamento.CONCLUIDO
        },
        _sum: {
          valorContrato: true
        },
        _avg: {
          taxaJurosNova: true
        }
      })
    ]);

    const refinanciamentosConcluidos = await this.prisma.refinanciamento.findMany({
      where: {
        ...filtros,
        status: StatusRefinanciamento.CONCLUIDO
      },
      select: {
        dataCriacao: true,
        dataAtualizacao: true,
        valorParcela: true,
        prazoTotal: true
      }
    });

    const economiaTotal = refinanciamentosConcluidos.reduce((acc, ref) => {
      return acc + (ref.valorParcela * ref.prazoTotal);
    }, 0);

    const tempoMedioAprovacao = refinanciamentosConcluidos.reduce((acc, ref) => {
      const diff = ref.dataAtualizacao.getTime() - ref.dataCriacao.getTime();
      return acc + diff;
    }, 0) / (refinanciamentosConcluidos.length || 1);

    return {
      total,
      totalAprovados,
      totalReprovados,
      totalEmAnalise,
      valorTotalRefinanciado: valores._sum.valorContrato || 0,
      economiaTotal,
      tempoMedioAprovacao
    };
  }
}
