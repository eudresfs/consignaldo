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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoService = void 0;
let AverbacaoService = class AverbacaoService {
    constructor(averbacaoRepository, funcionarioService) {
        this.averbacaoRepository = averbacaoRepository;
        this.funcionarioService = funcionarioService;
    }
    async criarAverbacao(data) {
        // Validar margem
        const margem = await this.calcularMargem(data.funcionarioId);
        if (data.valorParcela > margem) {
            throw new MargemInsuficienteException({
                margem,
                valorParcela: data.valorParcela,
                funcionarioId: data.funcionarioId
            });
        }
        // Criar averbação
        return this.averbacaoRepository.create({
            ...data,
            valorTotal: data.valor,
            saldoDevedor: data.valor,
            situacaoId: AverbacaoStatus.AGUARDANDO_APROVACAO,
            data: new Date(),
            ativo: true
        });
    }
    async calcularMargem(funcionarioId) {
        const funcionario = await this.funcionarioService.findById(funcionarioId);
        const averbacoesAtivas = await this.averbacaoRepository.findAtivas(funcionarioId);
        const margemComprometida = averbacoesAtivas.reduce((total, averbacao) => total + averbacao.valorParcela, 0);
        return (funcionario.salario * 0.3) - margemComprometida;
    }
};
exports.AverbacaoService = AverbacaoService;
exports.AverbacaoService = AverbacaoService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof AverbacaoRepository !== "undefined" && AverbacaoRepository) === "function" ? _a : Object, typeof (_b = typeof FuncionarioService !== "undefined" && FuncionarioService) === "function" ? _b : Object])
], AverbacaoService);
