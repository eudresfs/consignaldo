"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoParcelaSituacaoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoParcelaSituacaoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoParcelaSituacao';
    }
}
exports.AverbacaoParcelaSituacaoRepository = AverbacaoParcelaSituacaoRepository;
