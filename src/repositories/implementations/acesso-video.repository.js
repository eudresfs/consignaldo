"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcessoVideoRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class AcessoVideoRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'acessoVideo';
    }
}
exports.AcessoVideoRepository = AcessoVideoRepository;
