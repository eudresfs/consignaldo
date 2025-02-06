import { Produto, IProduto } from "../domain/produto.entity";
import { CriarProdutoDto } from "../dtos/criar-produto.dto";
import { ProdutoRepository } from '../repositories/implementations/produto.repository';
import { PrismaClient } from '@prisma/client';

/**
 * Serviço para operações relacionadas a Produto.
 */
export class ProdutoService {
  constructor(
    private readonly repository: ProdutoRepository = new ProdutoRepository(new PrismaClient())
  ) {}

  /**
   * Cria um novo Produto.
   * @param dto Dados para criação do Produto.
   * @returns Produto criado.
   */
  async criarProduto(dto: CriarProdutoDto): Promise<IProduto> {
    const produto = new Produto(
      0,
      dto.nome,
      dto.descricao,
      dto.preco,
      true,
      new Date(),
      new Date()
    );
    return await this.repository.criar(produto);
  }

  /**
   * Lista todos os Produtos.
   */
  async listarProdutos(): Promise<IProduto[]> {
    return await this.repository.listar();
  }
} 