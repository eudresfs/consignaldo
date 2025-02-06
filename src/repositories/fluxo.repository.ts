import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Fluxo } from '../domain/fluxo.entity';

@Injectable()
export class FluxoRepository extends BaseRepository<Fluxo> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'fluxo' as keyof PrismaClient;
  }
} 