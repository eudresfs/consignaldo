/**
 * Repositório responsável pela persistência da entidade Averbacao.
 * Por enquanto, implementado de forma in-memory para exemplificação.
 */
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IAverbacao } from '../../domain/averbacao.entity';

export class AverbacaoRepository extends BaseRepository<IAverbacao> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'averbacao' as keyof PrismaClient;
  }

  /**
   * Busca todas as averbações de um funcionário, incluindo dados relacionados.
   */
  async findByFuncionario(funcionarioId: number): Promise<IAverbacao[]> {
    return (this.prisma[this.getModelName()] as any).findMany({
      where: { funcionarioId },
      include: {
        funcionario: true,
        empresa: true,
        produto: true,
        situacao: true,
      },
    });
  }

  /**
   * Busca as averbações ativas de um funcionário, considerando a situação 'ATIVO'
   * e incluindo as parcelas associadas.
   */
  async findAtivas(funcionarioId: number): Promise<IAverbacao[]> {
    return (this.prisma[this.getModelName()] as any).findMany({
      where: {
        funcionarioId,
        ativo: true,
        situacao: { descricao: 'ATIVO' },
      },
      include: { parcelas: true },
    });
  }
} 