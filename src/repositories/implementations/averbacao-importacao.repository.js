"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoImportacaoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoImportacaoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoImportacao';
    }
}
exports.AverbacaoImportacaoRepository = AverbacaoImportacaoRepository;
