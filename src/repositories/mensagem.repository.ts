import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Mensagem } from '../domain/mensagem.entity';

@Injectable()
export class MensagemRepository extends BaseRepository<Mensagem> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'mensagem' as keyof PrismaClient;
  }
} 