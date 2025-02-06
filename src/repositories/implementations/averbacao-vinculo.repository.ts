import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoVinculo } from '../../domain/averbacao-vinculo.entity';

export class AverbacaoVinculoRepository extends BaseRepository<IAverbacaoVinculo> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'averbacaoVinculo' as keyof PrismaClient;
  }
} 