"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoVinculoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AverbacaoVinculoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'averbacaoVinculo';
    }
}
exports.AverbacaoVinculoRepository = AverbacaoVinculoRepository;
