"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoPrismaRepository = void 0;
const client_1 = require("@prisma/client");
/**
 * Repositório de Averbacão utilizando o Prisma para persistência.
 */
class AverbacaoPrismaRepository {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    /**
     * Cria uma nova Averbacão no banco de dados.
     * @param averbacao Instância da entidade Averbacão a ser persistida.
     * @returns A Averbacão criada com os dados persistidos.
     */
    async criar(averbacao) {
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
    async listar() {
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
}
exports.AverbacaoPrismaRepository = AverbacaoPrismaRepository;
