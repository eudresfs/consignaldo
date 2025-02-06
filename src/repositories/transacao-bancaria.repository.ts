import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { StatusConciliacao } from '../domain/conciliacao/conciliacao.types';

@Injectable()
export class TransacaoBancariaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: Prisma.TransacaoBancariaCreateInput) {
    return this.prisma.transacaoBancaria.create({
      data,
      include: {
        contrato: true,
        banco: true
      }
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.transacaoBancaria.findUnique({
      where: { id },
      include: {
        contrato: true,
        banco: true
      }
    });
  }

  async listarPorFiltros(filtros: {
    status?: StatusConciliacao;
    bancoId?: number;
    dataInicial?: Date;
    dataFinal?: Date;
  }) {
    const where: Prisma.TransacaoBancariaWhereInput = {
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.bancoId && { bancoId: filtros.bancoId }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataPagamento: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.transacaoBancaria.findMany({
      where,
      include: {
        contrato: true,
        banco: true
      },
      orderBy: {
        dataPagamento: 'desc'
      }
    });
  }

  async atualizarStatus(id: string, status: StatusConciliacao, divergencias?: any) {
    return this.prisma.transacaoBancaria.update({
      where: { id },
      data: {
        status,
        ...(divergencias && { divergencias }),
        dataConciliacao: new Date()
      }
    });
  }

  async contarPorFiltros(filtros: {
    status?: StatusConciliacao;
    bancoId?: number;
    dataInicial?: Date;
    dataFinal?: Date;
  }) {
    const where: Prisma.TransacaoBancariaWhereInput = {
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.bancoId && { bancoId: filtros.bancoId }),
      ...(filtros.dataInicial && filtros.dataFinal && {
        dataPagamento: {
          gte: filtros.dataInicial,
          lte: filtros.dataFinal
        }
      })
    };

    return this.prisma.transacaoBancaria.count({ where });
  }

  async obterEstatisticas() {
    const [totalTransacoes, transacoesPorStatus, divergenciasPorBanco] = await Promise.all([
      this.prisma.transacaoBancaria.count(),
      this.prisma.transacaoBancaria.groupBy({
        by: ['status'],
        _count: true
      }),
      this.prisma.transacaoBancaria.groupBy({
        by: ['bancoId'],
        where: {
          status: StatusConciliacao.DIVERGENTE as string
        },
        _count: true
      })
    ]);

    return {
      totalTransacoes,
      transacoesPorStatus,
      divergenciasPorBanco
    };
  }
}
