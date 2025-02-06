"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaService = void 0;
const empresa_entity_1 = require("../domain/empresa.entity");
const empresa_prisma_repository_1 = require("../repositories/empresa.prisma.repository");
/**
 * Serviço para operações relacionadas a Empresa.
 */
class EmpresaService {
    constructor(repository = new empresa_prisma_repository_1.EmpresaPrismaRepository()) {
        this.repository = repository;
    }
    /**
     * Cria uma nova Empresa.
     * @param dto Dados para criação da Empresa.
     * @returns Empresa criada.
     */
    async criarEmpresa(dto) {
        const empresa = new empresa_entity_1.Empresa(0, dto.nome, dto.cnpj, true);
        return await this.repository.criar(empresa);
    }
    /**
     * Lista todas as Empresas.
     */
    async listarEmpresas() {
        return await this.repository.listar();
    }
}
exports.EmpresaService = EmpresaService;
