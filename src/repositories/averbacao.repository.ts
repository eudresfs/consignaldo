import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Averbacao } from '../domain/averbacao.entity';

@Injectable()
export class AverbacaoRepository extends BaseRepository<Averbacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    // Certifique-se que no schema Prisma o modelo se chama "averbacao"
    return 'averbacao' as keyof PrismaClient;
  }
} 