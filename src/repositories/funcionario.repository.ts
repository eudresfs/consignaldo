import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { Funcionario } from '../domain/funcionario.entity';

@Injectable()
export class FuncionarioRepository extends BaseRepository<Funcionario> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  protected getModelName(): keyof PrismaClient {
    return 'funcionario' as keyof PrismaClient;
  }
} 