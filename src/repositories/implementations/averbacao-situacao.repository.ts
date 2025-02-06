import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacaoSituacao } from '../../domain/averbacao-situacao.entity';

/**
 * Repositório para gerenciar situações de averbação
 */
export class AverbacaoSituacaoRepository extends BaseRepository<IAverbacaoSituacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'averbacaoSituacao' as keyof PrismaClient;
  }

  /**
   * Busca uma situação pela descrição
   */
  async findByDescricao(descricao: string): Promise<IAverbacaoSituacao | null> {
    return (this.prisma[this.getModelName()] as any).findFirst({
      where: {
        descricao: {
          equals: descricao,
          mode: 'insensitive',
        },
      },
    });
  }
} 