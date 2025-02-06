import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoParcelaSituacao } from '../../domain/averbacao-parcela-situacao.entity';

export class AverbacaoParcelaSituacaoRepository extends BaseRepository<IAverbacaoParcelaSituacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'averbacaoParcelaSituacao' as keyof PrismaClient;
  }
} 