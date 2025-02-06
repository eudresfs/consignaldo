"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
class FuncionarioRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    // Forçamos o cast da string 'funcionario' para o tipo esperado
    getModelName() {
        return 'funcionario';
    }
    // Método específico para buscar funcionário pela matrícula
    async findByMatricula(matricula) {
        const result = await this.prisma[this.getModelName()].findUnique({
            where: { matricula },
        });
        return result ? this.mapDates(result) : null;
    }
    // Método auxiliar para mapear os campos de data
    mapDates(funcionario) {
        const { criadoEm, atualizadoEm, ...rest } = funcionario;
        return {
            ...rest,
            createdAt: new Date(criadoEm || funcionario.createdAt),
            updatedAt: new Date(atualizadoEm || funcionario.updatedAt),
        };
    }
}
exports.FuncionarioRepository = FuncionarioRepository;
