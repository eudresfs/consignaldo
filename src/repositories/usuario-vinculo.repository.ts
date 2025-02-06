import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { Prisma, UsuarioVinculo } from '@prisma/client';

@Injectable()
export class UsuarioVinculoRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UsuarioVinculoCreateInput): Promise<UsuarioVinculo> {
    return this.prisma.usuarioVinculo.create({ data });
  }

  async findAll(): Promise<UsuarioVinculo[]> {
    return this.prisma.usuarioVinculo.findMany({
      where: { ativo: true },
      include: {
        usuario: true,
        vinculo: {
          include: {
            consignataria: true,
            consignante: true
          }
        }
      }
    });
  }

  async findById(id: number): Promise<UsuarioVinculo | null> {
    return this.prisma.usuarioVinculo.findUnique({
      where: { id },
      include: {
        usuario: true,
        vinculo: {
          include: {
            consignataria: true,
            consignante: true
          }
        }
      }
    });
  }

  async update(id: number, data: Prisma.UsuarioVinculoUpdateInput): Promise<UsuarioVinculo> {
    return this.prisma.usuarioVinculo.update({
      where: { id },
      data
    });
  }

  async softDelete(id: number): Promise<UsuarioVinculo> {
    return this.prisma.usuarioVinculo.update({
      where: { id },
      data: { ativo: false }
    });
  }

  async findByUsuario(usuarioId: number): Promise<UsuarioVinculo[]> {
    return this.prisma.usuarioVinculo.findMany({
      where: { 
        usuarioId,
        ativo: true 
      },
      include: {
        vinculo: {
          include: {
            consignataria: true,
            consignante: true
          }
        }
      }
    });
  }

  async findByVinculo(vinculoId: number): Promise<UsuarioVinculo[]> {
    return this.prisma.usuarioVinculo.findMany({
      where: { 
        vinculoId,
        ativo: true 
      },
      include: {
        usuario: true
      }
    });
  }
}
