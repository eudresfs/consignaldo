import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAcessoVideo } from '../../domain/acesso-video.entity';

export class AcessoVideoRepository extends BaseRepository<IAcessoVideo> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'acessoVideo' as keyof PrismaClient;
  }
} 