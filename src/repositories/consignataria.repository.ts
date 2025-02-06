import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { Prisma, Consignataria } from '@prisma/client';

@Injectable()
export class ConsignatariaRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ConsignatariaCreateInput): Promise<Consignataria> {
    return this.prisma.consignataria.create({ data });
  }

  async findAll(): Promise<Consignataria[]> {
    return this.prisma.consignataria.findMany({
      where: { ativo: true }
    });
  }

  async findById(id: number): Promise<Consignataria | null> {
    return this.prisma.consignataria.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: Prisma.ConsignatariaUpdateInput): Promise<Consignataria> {
    return this.prisma.consignataria.update({
      where: { id },
      data
    });
  }

  async softDelete(id: number): Promise<Consignataria> {
    return this.prisma.consignataria.update({
      where: { id },
      data: { ativo: false }
    });
  }

  async findWithVinculos(id: number): Promise<Consignataria | null> {
    return this.prisma.consignataria.findUnique({
      where: { id },
      include: {
        vinculos: {
          where: { ativo: true },
          include: {
            consignante: true
          }
        }
      }
    });
  }
}
