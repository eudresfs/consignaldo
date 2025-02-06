"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoService = void 0;
/**
 * Serviço de Averbação que orquestra a criação de contratos consignados.
 */
const averbacao_entity_1 = require("../domain/averbacao.entity");
const validacao_service_1 = require("./validacao.service");
const margem_service_1 = require("./margem.service");
const averbacao_prisma_repository_1 = require("../repositories/averbacao.prisma.repository");
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const averbacao_repository_1 = require("../repositories/averbacao.repository");
let AverbacaoService = class AverbacaoService {
    constructor(cacheManager, validacaoService = new validacao_service_1.ValidacaoService(), margemService = new margem_service_1.MargemService(), averbacaoRepository = new averbacao_prisma_repository_1.AverbacaoPrismaRepository(), repository) {
        this.cacheManager = cacheManager;
        this.validacaoService = validacaoService;
        this.margemService = margemService;
        this.averbacaoRepository = averbacaoRepository;
        this.repository = repository;
    }
    /**
     * Cria uma nova averbação após validar as regras de negócio e calcular a margem.
     * @param dto Dados para criação da averbação
     * @returns Averbação criada
     */
    async criarAverbacao(dto) {
        // Executa as validações necessárias.
        await this.validacaoService.validarMargem(dto);
        // Calcula a margem disponível.
        const margemCalculada = await this.margemService.calcularMargem(dto);
        // Verifica se o valor da parcela não ultrapassa a margem disponível.
        if (dto.valorParcela > margemCalculada) {
            throw new Error(`Margem insuficiente: margem disponível = ${margemCalculada}, valor da parcela = ${dto.valorParcela}`);
        }
        // Instancia uma nova Averbacao com status padrão "Aguardando" (3).
        const novaAverbacao = new averbacao_entity_1.Averbacao(0, // O ID será definido pelo repositório
        dto.funcionarioId, new Date(dto.data), dto.valor, true);
        // Persiste a nova averbação e retorna o resultado.
        const result = await this.averbacaoRepository.criar(novaAverbacao);
        return result;
    }
    /**
     * Lista todas as Averbacões.
     */
    async listarAverbacoes() {
        return await this.averbacaoRepository.listar();
    }
    async findById(id) {
        const cacheKey = `averbacao:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const averbacao = await this.repository.findById(id);
        if (averbacao) {
            await this.cacheManager.set(cacheKey, averbacao, 60 * 15); // 15 min
        }
        return averbacao;
    }
    async findAll(page = 1, limit = 10) {
        return this.repository.findAll(page, limit);
    }
    async create(dto) {
        return this.repository.create(dto);
    }
};
exports.AverbacaoService = AverbacaoService;
exports.AverbacaoService = AverbacaoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, validacao_service_1.ValidacaoService,
        margem_service_1.MargemService, typeof (_a = typeof averbacao_prisma_repository_1.AverbacaoPrismaRepository !== "undefined" && averbacao_prisma_repository_1.AverbacaoPrismaRepository) === "function" ? _a : Object, averbacao_repository_1.AverbacaoRepository])
], AverbacaoService);
