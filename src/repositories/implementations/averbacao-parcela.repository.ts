import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoParcela } from '../../domain/averbacao-parcela.entity';

export class AverbacaoParcelaRepository extends BaseRepository<IAverbacaoParcela> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'averbacaoParcela' as keyof PrismaClient;
  }
} 