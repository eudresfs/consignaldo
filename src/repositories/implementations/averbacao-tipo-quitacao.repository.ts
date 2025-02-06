import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoTipoQuitacao } from '../../domain/averbacao-tipo-quitacao.entity';

export class AverbacaoTipoQuitacaoRepository extends BaseRepository<IAverbacaoTipoQuitacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'averbacaoTipoQuitacao' as keyof PrismaClient;
  }
} 