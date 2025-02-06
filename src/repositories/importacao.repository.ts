import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Importacao } from '../domain/importacao.entity';

@Injectable()
export class ImportacaoRepository extends BaseRepository<Importacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'importacao' as keyof PrismaClient;
  }
} 