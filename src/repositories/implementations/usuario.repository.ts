import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IUsuario } from '../../domain/usuario.entity';

export class UsuarioRepository extends BaseRepository<IUsuario> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'usuario' as keyof PrismaClient;
  }
} 