import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { Prisma, Vinculo } from '@prisma/client';

@Injectable()
export class VinculoRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.VinculoCreateInput): Promise<Vinculo> {
    return this.prisma.vinculo.create({ data });
  }

  async findAll(): Promise<Vinculo[]> {
    return this.prisma.vinculo.findMany({
      where: { ativo: true },
      include: {
        consignataria: true,
        consignante: true
      }
    });
  }

  async findById(id: number): Promise<Vinculo | null> {
    return this.prisma.vinculo.findUnique({
      where: { id },
      include: {
        consignataria: true,
        consignante: true
      }
    });
  }

  async update(id: number, data: Prisma.VinculoUpdateInput): Promise<Vinculo> {
    return this.prisma.vinculo.update({
      where: { id },
      data
    });
  }

  async softDelete(id: number): Promise<Vinculo> {
    return this.prisma.vinculo.update({
      where: { id },
      data: { ativo: false }
    });
  }

  async findByConsignataria(consignatariaId: number): Promise<Vinculo[]> {
    return this.prisma.vinculo.findMany({
      where: { 
        consignatariaId,
        ativo: true 
      },
      include: {
        consignante: true
      }
    });
  }

  async findByConsignante(consignanteId: number): Promise<Vinculo[]> {
    return this.prisma.vinculo.findMany({
      where: { 
        consignanteId,
        ativo: true 
      },
      include: {
        consignataria: true
      }
    });
  }

  async findByConsignatariaAndConsignante(
    consignatariaId: number,
    consignanteId: number
  ): Promise<Vinculo | null> {
    return this.prisma.vinculo.findFirst({
      where: {
        consignatariaId,
        consignanteId,
        ativo: true
      }
    });
  }
}
