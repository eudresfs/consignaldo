"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoTramitacaoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoTramitacaoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoTramitacao';
    }
}
exports.AverbacaoTramitacaoRepository = AverbacaoTramitacaoRepository;
