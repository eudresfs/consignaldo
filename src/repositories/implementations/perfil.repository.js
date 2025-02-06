"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
/**
 * Repositório de Perfil utilizando o Prisma para persistência.
 */
class PerfilRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'perfil';
    }
    /**
     * Cria um novo Perfil no banco de dados.
     * @param perfil Instância do Perfil a ser persistido.
     * @returns Perfil criado com os dados persistidos.
     */
    async criar(perfil) {
        const created = await this.prisma.perfil.create({
            data: {
                nome: perfil.nome,
                descricao: perfil.descricao,
                ativo: perfil.ativo,
            },
        });
        return {
            ...perfil,
            id: created.id,
            criadoEm: created.createdAt || new Date(),
            atualizadoEm: created.updatedAt || new Date(),
        };
    }
    /**
     * Lista todos os Perfis cadastrados.
     * @returns Array de Perfis.
     */
    async listar() {
        const perfis = await this.prisma.perfil.findMany();
        return perfis.map(p => ({
            id: p.id,
            nome: p.nome,
            descricao: p.descricao,
            ativo: p.ativo,
            criadoEm: p.createdAt,
            atualizadoEm: p.updatedAt,
        }));
    }
}
exports.PerfilRepository = PerfilRepository;
