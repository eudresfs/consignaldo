import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoImportacao } from '../../domain/averbacao-importacao.entity';

export class AverbacaoImportacaoRepository extends BaseRepository<IAverbacaoImportacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'averbacaoImportacao' as keyof PrismaClient;
  }
} 