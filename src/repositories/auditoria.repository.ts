import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Auditoria } from '../domain/auditoria.entity';

@Injectable()
export class AuditoriaRepository extends BaseRepository<Auditoria> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'auditoria' as keyof PrismaClient;
  }
} 