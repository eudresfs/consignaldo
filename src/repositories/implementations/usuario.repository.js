"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class UsuarioRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'usuario';
    }
}
exports.UsuarioRepository = UsuarioRepository;
