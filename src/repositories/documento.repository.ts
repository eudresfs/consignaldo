import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  IDocumento,
  IFiltrosDocumento,
  StatusDocumento 
} from '../domain/documentos/documento.types';

@Injectable()
export class DocumentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: Omit<IDocumento, 'id' | 'dataCriacao' | 'dataAtualizacao'>) {
    return this.prisma.documento.create({
      data: {
        ...data,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      },
      include: {
        usuario: true
      }
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.documento.findUnique({
      where: { id },
      include: {
        usuario: true
      }
    });
  }

  async atualizar(id: string, data: Partial<IDocumento>) {
    return this.prisma.documento.update({
      where: { id },
      data: {
        ...data,
        dataAtualizacao: new Date()
      },
      include: {
        usuario: true
      }
    });
  }

  async deletar(id: string) {
    return this.prisma.documento.delete({
      where: { id }
    });
  }

  async listarPorFiltros(filtros: IFiltrosDocumento) {
    const where: Prisma.DocumentoWhereInput = {
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.entidadeId && { entidadeId: filtros.entidadeId }),
      ...(filtros.entidadeTipo && { entidadeTipo: filtros.entidadeTipo }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataCriacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      }),
      ...(filtros.tags && {
        metadata: {
          path: ['tags'],
          array_contains: filtros.tags
        }
      })
    };

    return this.prisma.documento.findMany({
      where,
      include: {
        usuario: true
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    });
  }

  async contarPorFiltros(filtros: IFiltrosDocumento) {
    const where: Prisma.DocumentoWhereInput = {
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.entidadeId && { entidadeId: filtros.entidadeId }),
      ...(filtros.entidadeTipo && { entidadeTipo: filtros.entidadeTipo }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataCriacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      }),
      ...(filtros.tags && {
        metadata: {
          path: ['tags'],
          array_contains: filtros.tags
        }
      })
    };

    return this.prisma.documento.count({ where });
  }

  async atualizarStatus(id: string, status: StatusDocumento, observacoes?: string) {
    return this.prisma.documento.update({
      where: { id },
      data: {
        status,
        metadata: {
          update: {
            observacoes
          }
        },
        dataAtualizacao: new Date()
      }
    });
  }

  async buscarDocumentosExpirados() {
    return this.prisma.documento.findMany({
      where: {
        dataExpiracao: {
          lt: new Date()
        },
        status: {
          not: StatusDocumento.EXPIRADO
        }
      }
    });
  }

  async obterEstatisticas() {
    const [
      totalDocumentos,
      documentosPorTipo,
      documentosPorStatus,
      documentosPorArmazenamento
    ] = await Promise.all([
      this.prisma.documento.count(),
      this.prisma.documento.groupBy({
        by: ['tipo'],
        _count: true
      }),
      this.prisma.documento.groupBy({
        by: ['status'],
        _count: true
      }),
      this.prisma.documento.groupBy({
        by: ['tipoArmazenamento'],
        _count: true,
        _sum: {
          tamanho: true
        }
      })
    ]);

    return {
      totalDocumentos,
      documentosPorTipo,
      documentosPorStatus,
      documentosPorArmazenamento
    };
  }
}
