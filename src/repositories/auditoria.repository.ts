import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  TipoAuditoria, 
  TipoOperacao, 
  NivelCriticidade,
  IFiltrosAuditoria 
} from '../domain/auditoria/auditoria.types';

@Injectable()
export class AuditoriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(data: {
    tipo: TipoAuditoria;
    operacao: TipoOperacao;
    criticidade: NivelCriticidade;
    usuarioId: number;
    entidadeId?: string;
    entidadeTipo?: string;
    dadosAnteriores?: any;
    dadosNovos?: any;
    metadata?: any;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditoria.create({
      data: {
        ...data,
        dataCriacao: new Date()
      },
      include: {
        usuario: true
      }
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.auditoria.findUnique({
      where: { id },
      include: {
        usuario: true
      }
    });
  }

  async listarPorFiltros(filtros: IFiltrosAuditoria) {
    const where: Prisma.AuditoriaWhereInput = {
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.operacao && { operacao: filtros.operacao }),
      ...(filtros.criticidade && { criticidade: filtros.criticidade }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.entidadeId && { entidadeId: filtros.entidadeId }),
      ...(filtros.entidadeTipo && { entidadeTipo: filtros.entidadeTipo }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataCriacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.auditoria.findMany({
      where,
      include: {
        usuario: true
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    });
  }

  async contarPorFiltros(filtros: IFiltrosAuditoria) {
    const where: Prisma.AuditoriaWhereInput = {
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.operacao && { operacao: filtros.operacao }),
      ...(filtros.criticidade && { criticidade: filtros.criticidade }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.entidadeId && { entidadeId: filtros.entidadeId }),
      ...(filtros.entidadeTipo && { entidadeTipo: filtros.entidadeTipo }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataCriacao: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.auditoria.count({ where });
  }

  async obterEstatisticas() {
    const [
      totalRegistros,
      registrosPorTipo,
      registrosPorOperacao,
      registrosPorCriticidade
    ] = await Promise.all([
      this.prisma.auditoria.count(),
      this.prisma.auditoria.groupBy({
        by: ['tipo'],
        _count: true
      }),
      this.prisma.auditoria.groupBy({
        by: ['operacao'],
        _count: true
      }),
      this.prisma.auditoria.groupBy({
        by: ['criticidade'],
        _count: true
      })
    ]);

    return {
      totalRegistros,
      registrosPorTipo,
      registrosPorOperacao,
      registrosPorCriticidade
    };
  }
}