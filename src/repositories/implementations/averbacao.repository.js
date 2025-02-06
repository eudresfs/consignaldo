"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacao';
    }
    /**
     * Busca todas as averbações de um funcionário, incluindo dados relacionados.
     */
    async findByFuncionario(funcionarioId) {
        return this.prisma[this.getModelName()].findMany({
            where: { funcionarioId },
            include: {
                funcionario: true,
                empresa: true,
                produto: true,
                situacao: true,
            },
        });
    }
    /**
     * Busca as averbações ativas de um funcionário, considerando a situação 'ATIVO'
     * e incluindo as parcelas associadas.
     */
    async findAtivas(funcionarioId) {
        return this.prisma[this.getModelName()].findMany({
            where: {
                funcionarioId,
                ativo: true,
                situacao: { descricao: 'ATIVO' },
            },
            include: { parcelas: true },
        });
    }
}
exports.AverbacaoRepository = AverbacaoRepository;
