"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoHistoricoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoHistoricoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoHistorico';
    }
}
exports.AverbacaoHistoricoRepository = AverbacaoHistoricoRepository;
