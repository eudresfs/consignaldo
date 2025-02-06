import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Permissao } from '../domain/permissao.entity';

@Injectable()
export class PermissaoRepository extends BaseRepository<Permissao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'permissao' as keyof PrismaClient;
  }
} 