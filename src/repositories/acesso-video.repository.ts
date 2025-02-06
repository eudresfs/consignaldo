import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { AcessoVideo } from '../domain/acesso-video.entity';

@Injectable()
export class AcessoVideoRepository extends BaseRepository<AcessoVideo> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    // No schema Prisma, verifique se o modelo está definido como "acessoVideo" ou "acesso_video"
    return 'acessoVideo' as keyof PrismaClient;
  }
} 