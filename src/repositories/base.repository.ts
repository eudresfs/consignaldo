import { PrismaClient } from '@prisma/client';
import { IBaseRepository } from './interfaces/base.repository.interface';
import { DatabaseError } from '../errors/database.error';
import { PaginatedResult } from '../types/common.types';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<T | null> {
    return (this.prisma[this.getModelName()] as any).findUnique({
      where: { id },
    });
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      (this.prisma[this.getModelName()] as any).findMany({
        skip,
        take: limit,
      }),
      (this.prisma[this.getModelName()] as any).count(),
    ]);
    
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      return await (this.prisma[this.getModelName()] as any).create({ data });
    } catch (error) {
      throw new DatabaseError('Erro ao criar registro', error);
    }
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    return (this.prisma[this.getModelName()] as any).update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await (this.prisma[this.getModelName()] as any).delete({
      where: { id },
    });
  }

  protected abstract getModelName(): keyof PrismaClient;
} 