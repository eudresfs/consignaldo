"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoTipoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
/**
 * Repositório para gerenciar tipos de averbação
 */
class AverbacaoTipoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoTipo';
    }
    /**
     * Busca um tipo de averbação pela sigla
     */
    async findBySigla(sigla) {
        return this.prisma[this.getModelName()].findFirst({
            where: { sigla: { equals: sigla, mode: 'insensitive' } },
        });
    }
    /**
     * Lista tipos de averbação ativos
     */
    async findAtivos() {
        return this.prisma[this.getModelName()].findMany({
            where: { ativo: true },
            orderBy: { descricao: 'asc' },
        });
    }
}
exports.AverbacaoTipoRepository = AverbacaoTipoRepository;
