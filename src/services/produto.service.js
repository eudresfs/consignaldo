"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoService = void 0;
const produto_entity_1 = require("../domain/produto.entity");
const produto_repository_1 = require("../repositories/implementations/produto.repository");
const client_1 = require("@prisma/client");
/**
 * Serviço para operações relacionadas a Produto.
 */
class ProdutoService {
    constructor(repository = new produto_repository_1.ProdutoRepository(new client_1.PrismaClient())) {
        this.repository = repository;
    }
    /**
     * Cria um novo Produto.
     * @param dto Dados para criação do Produto.
     * @returns Produto criado.
     */
    async criarProduto(dto) {
        const produto = new produto_entity_1.Produto(0, dto.nome, dto.descricao, dto.preco, true, new Date(), new Date());
        return await this.repository.criar(produto);
    }
    /**
     * Lista todos os Produtos.
     */
    async listarProdutos() {
        return await this.repository.listar();
    }
}
exports.ProdutoService = ProdutoService;
