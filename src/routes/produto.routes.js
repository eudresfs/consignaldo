"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtoRoutes = void 0;
const express_1 = require("express");
const produto_controller_1 = require("../controllers/produto.controller");
// Função auxiliar para capturar erros de funções async
const asyncHandler = (fn) => {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
const router = (0, express_1.Router)();
exports.produtoRoutes = router;
const controller = new produto_controller_1.ProdutoController();
/**
 * Rota para criação de Produto (POST /produtos)
 */
router.post("/", asyncHandler(controller.criarProduto));
/**
 * Rota para listagem de Produtos (GET /produtos)
 */
router.get("/", asyncHandler(controller.listarProdutos));
