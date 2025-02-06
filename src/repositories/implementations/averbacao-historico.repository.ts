import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoHistorico } from '../../domain/averbacao-historico.entity';

export class AverbacaoHistoricoRepository extends BaseRepository<IAverbacaoHistorico> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'averbacaoHistorico' as keyof PrismaClient;
  }
} 