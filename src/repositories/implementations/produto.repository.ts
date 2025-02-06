// consignaldo/src/repositories/implementations/produto.repository.ts
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository'; // Importa a classe-base, que contém os métodos genéricos
import type { IProduto } from '../../domain/produto.entity';

/**
 * Repositório de Produto utilizando o Prisma para persistência.
 */
export class ProdutoRepository extends BaseRepository<IProduto> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'produto' as keyof PrismaClient;
  }

  /**
   * Cria um novo Produto no banco de dados.
   * @param produto Instância da entidade Produto a ser persistida.
   * @returns Produto criado com os dados persistidos.
   */
  async criar(produto: IProduto): Promise<IProduto> {
    const created = await this.prisma.produto.create({
      data: {
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco,
        ativo: produto.ativo,
      },
    });
    return {
      ...produto,
      id: created.id,
      createdAt: created.createdAt || new Date(),
      updatedAt: created.updatedAt || new Date(),
    };
  }

  /**
   * Lista todos os Produtos cadastrados.
   * @returns Array de Produtos.
   */
  async listar(): Promise<IProduto[]> {
    const produtos = await this.prisma.produto.findMany();
    return produtos.map(p => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      ativo: p.ativo,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }
}