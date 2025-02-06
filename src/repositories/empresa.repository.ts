import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Empresa } from '../domain/empresa.entity';

@Injectable()
export class EmpresaRepository extends BaseRepository<Empresa> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'empresa' as keyof PrismaClient;
  }
} 