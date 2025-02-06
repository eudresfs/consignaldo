"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilService = void 0;
const perfil_entity_1 = require("../domain/perfil.entity");
const perfil_prisma_repository_1 = require("../repositories/perfil.prisma.repository");
/**
 * Serviço para operações relacionadas a Perfil.
 */
class PerfilService {
    constructor(repository = new perfil_prisma_repository_1.PerfilPrismaRepository()) {
        this.repository = repository;
    }
    /**
     * Cria um novo Perfil.
     * @param dto Dados para criação do Perfil.
     * @returns Perfil criado.
     */
    async criarPerfil(dto) {
        const perfil = new perfil_entity_1.Perfil(0, dto.nome, dto.descricao, dto.ativo ?? true);
        return await this.repository.criar(perfil);
    }
    /**
     * Lista todos os Perfis.
     */
    async listarPerfis() {
        return await this.repository.listar();
    }
}
exports.PerfilService = PerfilService;
