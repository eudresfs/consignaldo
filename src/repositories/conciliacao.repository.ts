import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Conciliacao } from '../domain/conciliacao.entity';

@Injectable()
export class ConciliacaoRepository extends BaseRepository<Conciliacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'conciliacao' as keyof PrismaClient;
  }
} 