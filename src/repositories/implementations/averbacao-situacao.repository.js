"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoSituacaoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
/**
 * Repositório para gerenciar situações de averbação
 */
class AverbacaoSituacaoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoSituacao';
    }
    /**
     * Busca uma situação pela descrição
     */
    async findByDescricao(descricao) {
        return this.prisma[this.getModelName()].findFirst({
            where: {
                descricao: {
                    equals: descricao,
                    mode: 'insensitive',
                },
            },
        });
    }
}
exports.AverbacaoSituacaoRepository = AverbacaoSituacaoRepository;
