import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  TipoRelatorio, 
  FormatoRelatorio, 
  StatusRelatorio,
  IFiltrosRelatorio 
} from '../domain/relatorios/relatorio.types';

@Injectable()
export class RelatorioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: {
    tipo: TipoRelatorio;
    formato: FormatoRelatorio;
    filtros?: IFiltrosRelatorio;
    usuarioId: number;
  }) {
    return this.prisma.relatorio.create({
      data: {
        tipo: data.tipo,
        formato: data.formato,
        filtros: data.filtros,
        status: StatusRelatorio.PENDENTE,
        usuarioId: data.usuarioId
      },
      include: {
        usuario: true
      }
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.relatorio.findUnique({
      where: { id },
      include: {
        usuario: true
      }
    });
  }

  async listarPorFiltros(filtros: {
    tipo?: TipoRelatorio;
    status?: StatusRelatorio;
    usuarioId?: number;
    dataInicial?: Date;
    dataFinal?: Date;
  }) {
    const where: Prisma.RelatorioWhereInput = {
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataCriacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.relatorio.findMany({
      where,
      include: {
        usuario: true
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    });
  }

  async atualizarStatus(id: string, status: StatusRelatorio, metadata?: any) {
    return this.prisma.relatorio.update({
      where: { id },
      data: {
        status,
        ...(metadata && { metadata })
      }
    });
  }

  async atualizarUrlDownload(id: string, urlDownload: string) {
    return this.prisma.relatorio.update({
      where: { id },
      data: {
        urlDownload,
        status: StatusRelatorio.CONCLUIDO
      }
    });
  }

  async registrarErro(id: string, erro: string) {
    return this.prisma.relatorio.update({
      where: { id },
      data: {
        erro,
        status: StatusRelatorio.ERRO
      }
    });
  }

  async contarPorFiltros(filtros: {
    tipo?: TipoRelatorio;
    status?: StatusRelatorio;
    usuarioId?: number;
    dataInicial?: Date;
    dataFinal?: Date;
  }) {
    const where: Prisma.RelatorioWhereInput = {
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataCriacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.relatorio.count({ where });
  }

  async obterEstatisticas() {
    const [
      totalRelatorios,
      relatoriosPorTipo,
      relatoriosPorStatus
    ] = await Promise.all([
      this.prisma.relatorio.count(),
      this.prisma.relatorio.groupBy({
        by: ['tipo'],
        _count: true
      }),
      this.prisma.relatorio.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    return {
      totalRelatorios,
      relatoriosPorTipo,
      relatoriosPorStatus
    };
  }
}
