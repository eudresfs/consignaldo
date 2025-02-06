"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioService = void 0;
const funcionario_entity_1 = require("../domain/funcionario.entity");
const funcionario_prisma_repository_1 = require("../repositories/funcionario.prisma.repository");
/**
 * Serviço para operações relacionadas a Funcionário.
 */
class FuncionarioService {
    constructor(repository = new funcionario_prisma_repository_1.FuncionarioPrismaRepository()) {
        this.repository = repository;
    }
    /**
     * Cria um novo Funcionário.
     * @param dto Dados para criação do Funcionário.
     * @returns Funcionário criado.
     */
    async criarFuncionario(dto) {
        const funcionario = new funcionario_entity_1.Funcionario(0, dto.pessoaId, dto.empresaId, dto.matricula, dto.cargo || '', dto.setor || '', dto.situacao, dto.margemBruta, dto.margemLiquida, undefined, true);
        return await this.repository.criar(funcionario);
    }
    /**
     * Lista todos os Funcionários.
     */
    async listarFuncionarios() {
        return await this.repository.listar();
    }
}
exports.FuncionarioService = FuncionarioService;
