import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { Prisma, Consignante } from '@prisma/client';

@Injectable()
export class ConsignanteRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ConsignanteCreateInput): Promise<Consignante> {
    return this.prisma.consignante.create({ data });
  }

  async findAll(): Promise<Consignante[]> {
    return this.prisma.consignante.findMany({
      where: { ativo: true }
    });
  }

  async findById(id: number): Promise<Consignante | null> {
    return this.prisma.consignante.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: Prisma.ConsignanteUpdateInput): Promise<Consignante> {
    return this.prisma.consignante.update({
      where: { id },
      data
    });
  }

  async softDelete(id: number): Promise<Consignante> {
    return this.prisma.consignante.update({
      where: { id },
      data: { ativo: false }
    });
  }

  async findWithVinculos(id: number): Promise<Consignante | null> {
    return this.prisma.consignante.findUnique({
      where: { id },
      include: {
        vinculos: {
          where: { ativo: true },
          include: {
            consignataria: true
          }
        }
      }
    });
  }

  async findByTipo(tipo: string): Promise<Consignante[]> {
    return this.prisma.consignante.findMany({
      where: { 
        tipo,
        ativo: true 
      }
    });
  }
}
