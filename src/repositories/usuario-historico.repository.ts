import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { Prisma, UsuarioHistorico } from '@prisma/client';

@Injectable()
export class UsuarioHistoricoRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UsuarioHistoricoCreateInput): Promise<UsuarioHistorico> {
    return this.prisma.usuarioHistorico.create({ data });
  }

  async findAll(): Promise<UsuarioHistorico[]> {
    return this.prisma.usuarioHistorico.findMany({
      where: { ativo: true },
      include: {
        usuario: true
      },
      orderBy: {
        modifiedOn: 'desc'
      }
    });
  }

  async findById(id: number): Promise<UsuarioHistorico | null> {
    return this.prisma.usuarioHistorico.findUnique({
      where: { id },
      include: {
        usuario: true
      }
    });
  }

  async findByUsuario(usuarioId: number): Promise<UsuarioHistorico[]> {
    return this.prisma.usuarioHistorico.findMany({
      where: { 
        usuarioId,
        ativo: true 
      },
      orderBy: {
        modifiedOn: 'desc'
      }
    });
  }

  async findByAcao(acao: string): Promise<UsuarioHistorico[]> {
    return this.prisma.usuarioHistorico.findMany({
      where: { 
        acao,
        ativo: true 
      },
      include: {
        usuario: true
      },
      orderBy: {
        modifiedOn: 'desc'
      }
    });
  }

  async findByPeriodo(
    dataInicio: Date,
    dataFim: Date
  ): Promise<UsuarioHistorico[]> {
    return this.prisma.usuarioHistorico.findMany({
      where: {
        modifiedOn: {
          gte: dataInicio,
          lte: dataFim
        },
        ativo: true
      },
      include: {
        usuario: true
      },
      orderBy: {
        modifiedOn: 'desc'
      }
    });
  }
}
