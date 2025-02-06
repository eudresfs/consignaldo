import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoTipo } from '../../domain/averbacao-tipo.entity';

/**
 * Repositório para gerenciar tipos de averbação
 */
export class AverbacaoTipoRepository extends BaseRepository<IAverbacaoTipo> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'averbacaoTipo' as keyof PrismaClient;
  }

  /**
   * Busca um tipo de averbação pela sigla
   */
  async findBySigla(sigla: string): Promise<IAverbacaoTipo | null> {
    return (this.prisma[this.getModelName()] as any).findFirst({
      where: { sigla: { equals: sigla, mode: 'insensitive' } },
    });
  }

  /**
   * Lista tipos de averbação ativos
   */
  async findAtivos(): Promise<IAverbacaoTipo[]> {
    return (this.prisma[this.getModelName()] as any).findMany({
      where: { ativo: true },
      orderBy: { descricao: 'asc' },
    });
  }
} 