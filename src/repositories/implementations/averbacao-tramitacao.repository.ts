import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoTramitacao } from '../../domain/averbacao-tramitacao.entity';

export class AverbacaoTramitacaoRepository extends BaseRepository<IAverbacaoTramitacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'averbacaoTramitacao' as keyof PrismaClient;
  }
} 