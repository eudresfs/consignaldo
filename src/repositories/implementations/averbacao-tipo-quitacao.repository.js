"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoTipoQuitacaoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoTipoQuitacaoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoTipoQuitacao';
    }
}
exports.AverbacaoTipoQuitacaoRepository = AverbacaoTipoQuitacaoRepository;
