"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository"); // Importa a classe-base, que contém os métodos genéricos
/**
 * Repositório de Produto utilizando o Prisma para persistência.
 */
class ProdutoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'produto';
    }
    /**
     * Cria um novo Produto no banco de dados.
     * @param produto Instância da entidade Produto a ser persistida.
     * @returns Produto criado com os dados persistidos.
     */
    async criar(produto) {
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
    async listar() {
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
exports.ProdutoRepository = ProdutoRepository;
