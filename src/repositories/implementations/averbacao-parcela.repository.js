"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoParcelaRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoParcelaRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoParcela';
    }
}
exports.AverbacaoParcelaRepository = AverbacaoParcelaRepository;
