import { Request, Response } from "express";
import { ProdutoService } from "../services/produto.service";
import { ErrorHandler } from "../middleware/error.handler";
import { ProdutoRepository } from '../repositories/implementations/produto.repository';

/**
 * Controller para endpoints relacionados a Produto.
 */
export class ProdutoController {
  private produtoService: ProdutoService;

  constructor() {
    this.produtoService = new ProdutoService();
  }

  /**
   * Endpoint para criar um novo Produto.
   */
  criarProduto = async (req: Request, res: Response) => {
    try {
      const dto = req.body;
      const produto = await this.produtoService.criarProduto(dto);
      return res.status(201).json(produto);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };

  /**
   * Endpoint para listar Produtos.
   */
  listarProdutos = async (req: Request, res: Response) => {
    try {
      const produtos = await this.produtoService.listarProdutos();
      return res.json(produtos);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };
} 