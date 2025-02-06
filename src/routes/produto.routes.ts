import { Router, Request, Response, NextFunction } from "express";
import { ProdutoController } from "../controllers/produto.controller";
import { ProdutoRepository } from '../repositories/implementations/produto.repository';

// Função auxiliar para capturar erros de funções async
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): (req: Request, res: Response, next: NextFunction) => void => {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};

const router = Router();
const controller = new ProdutoController();

/**
 * Rota para criação de Produto (POST /produtos)
 */
router.post("/", asyncHandler(controller.criarProduto));

/**
 * Rota para listagem de Produtos (GET /produtos)
 */
router.get("/", asyncHandler(controller.listarProdutos));

export { router as produtoRoutes }; 