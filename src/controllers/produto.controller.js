"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoController = void 0;
const produto_service_1 = require("../services/produto.service");
const error_handler_1 = require("../middleware/error.handler");
/**
 * Controller para endpoints relacionados a Produto.
 */
class ProdutoController {
    constructor() {
        /**
         * Endpoint para criar um novo Produto.
         */
        this.criarProduto = async (req, res) => {
            try {
                const dto = req.body;
                const produto = await this.produtoService.criarProduto(dto);
                return res.status(201).json(produto);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        /**
         * Endpoint para listar Produtos.
         */
        this.listarProdutos = async (req, res) => {
            try {
                const produtos = await this.produtoService.listarProdutos();
                return res.json(produtos);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        this.produtoService = new produto_service_1.ProdutoService();
    }
}
exports.ProdutoController = ProdutoController;
