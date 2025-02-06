import { PrismaClient } from '@prisma/client';
import { Averbacao, IAverbacao } from '../domain/averbacao.entity';

/**
 * Repositório de Averbacão utilizando o Prisma para persistência.
 */
export class AverbacaoPrismaRepository {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Cria uma nova Averbacão no banco de dados.
   * @param averbacao Instância da entidade Averbacão a ser persistida.
   * @returns A Averbacão criada com os dados persistidos.
   */
  async criar(averbacao: Averbacao): Promise<IAverbacao> {
    const created = await this.prisma.averbacao.create({
      data: {
        funcionarioId: averbacao.funcionarioId,
        data: averbacao.data,
        valor: averbacao.valor,
        ativo: averbacao.ativo,
      },
    });
    return {
      ...averbacao,
      id: created.id,
      criadoEm: created.createdAt || new Date(),
      atualizadoEm: created.updatedAt || new Date(),
    };
  }

  /**
   * Lista todas as Averbacões cadastradas.
   * @returns Array de Averbacões.
   */
  async listar(): Promise<IAverbacao[]> {
    const averbacoes = await this.prisma.averbacao.findMany();
    return averbacoes.map(a => ({
      id: a.id,
      funcionarioId: a.funcionarioId,
      data: a.data,
      valor: a.valor,
      ativo: a.ativo,
      criadoEm: a.createdAt,
      atualizadoEm: a.updatedAt,
    }));
  }

  // Outros métodos (atualizar, listar, buscar por ID, etc.) podem ser implementados conforme necessário.
} 