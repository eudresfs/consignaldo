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
var LoanSimulationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanSimulationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const margem_service_1 = require("../margem.service");
const validacao_service_1 = require("../validacao.service");
const margem_insuficiente_exception_1 = require("../../exceptions/margem-insuficiente.exception");
const prazo_invalido_exception_1 = require("../../exceptions/prazo-invalido.exception");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_2 = require("@nestjs/common");
let LoanSimulationService = LoanSimulationService_1 = class LoanSimulationService {
    constructor(prisma, margemService, validacaoService, cacheManager) {
        this.prisma = prisma;
        this.margemService = margemService;
        this.validacaoService = validacaoService;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(LoanSimulationService_1.name);
        this.MARGEM_MAXIMA = 0.3;
        this.IOF_DIARIO = 0.0082;
        this.IOF_ADICIONAL = 0.38;
    }
    async simulateNewLoan(servidorId, consignatariaId, valorSolicitado, prazo) {
        const cacheKey = `loan_sim_${servidorId}_${consignatariaId}_${valorSolicitado}_${prazo}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const [servidor, produto] = await Promise.all([
            this.prisma.servidor.findUnique({ where: { id: servidorId } }),
            this.prisma.produto.findFirst({
                where: {
                    consignatariaId,
                    prazoMinimo: { lte: prazo },
                    prazoMaximo: { gte: prazo },
                    valorMinimo: { lte: valorSolicitado },
                    valorMaximo: { gte: valorSolicitado },
                    active: true,
                },
            }),
        ]);
        if (!produto) {
            throw new prazo_invalido_exception_1.PrazoInvalidoException({
                prazo,
                valor: valorSolicitado,
            });
        }
        const simulation = await this.calculateLoanTerms(valorSolicitado, prazo, produto.taxaJuros, servidor);
        await this.cacheManager.set(cacheKey, simulation, 3600000); // Cache por 1 hora
        return simulation;
    }
    async simulateRefinance(contratoId, valorSolicitado, prazo) {
        const contrato = await this.prisma.contrato.findUnique({
            where: { id: contratoId },
            include: { servidor: true },
        });
        if (!contrato) {
            throw new Error('Contrato não encontrado');
        }
        const simulation = await this.calculateLoanTerms(valorSolicitado, prazo, contrato.taxaJuros, contrato.servidor);
        const economiaTotal = this.calculateRefinanceEconomy(contrato, simulation);
        return {
            ...simulation,
            contratoId,
            saldoDevedor: contrato.saldoDevedor,
            valorLiquidacao: contrato.saldoDevedor,
            valorDisponivel: valorSolicitado - contrato.saldoDevedor,
            economiaTotal,
        };
    }
    async simulatePortability(contratoOrigemId, bancoOrigemId, prazo) {
        const contratoOrigem = await this.prisma.contrato.findUnique({
            where: { id: contratoOrigemId },
            include: { servidor: true },
        });
        if (!contratoOrigem) {
            throw new Error('Contrato de origem não encontrado');
        }
        const simulation = await this.calculateLoanTerms(contratoOrigem.saldoDevedor, prazo, contratoOrigem.taxaJuros * 0.7, // Taxa 30% menor
        contratoOrigem.servidor);
        const valorPresenteParcelas = this.calculatePresentValue(contratoOrigem.parcela, contratoOrigem.prazo, contratoOrigem.taxaJuros);
        return {
            ...simulation,
            contratoOrigemId,
            bancoOrigemId,
            saldoDevedor: contratoOrigem.saldoDevedor,
            valorPresenteParcelas,
            economiaTotal: this.calculatePortabilityEconomy(contratoOrigem, simulation, valorPresenteParcelas),
        };
    }
    async calculateLoanTerms(valorSolicitado, prazo, taxaJuros, servidor) {
        const taxaMensal = taxaJuros / 100;
        const valorParcela = this.calculateInstallment(valorSolicitado, prazo, taxaMensal);
        await this.validateMargin(servidor, valorParcela);
        const parcelas = this.generateInstallments(valorSolicitado, prazo, taxaMensal, valorParcela);
        const iof = this.calculateIOF(valorSolicitado, prazo);
        const cet = this.calculateCET(valorSolicitado, valorParcela, prazo, iof);
        return {
            id: undefined,
            servidorId: servidor.id,
            consignatariaId: undefined,
            valorSolicitado,
            prazo,
            taxaJuros,
            valorParcela,
            valorTotal: valorParcela * prazo,
            cet,
            iof,
            tarifas: [],
            parcelas,
            createdAt: new Date(),
        };
    }
    async validateMargin(servidor, valorParcela) {
        const margemDisponivel = await this.margemService.calcularMargemDisponivel(servidor.id);
        if (valorParcela > margemDisponivel) {
            throw new margem_insuficiente_exception_1.MargemInsuficienteException({
                margem: margemDisponivel,
                parcela: valorParcela,
                matricula: servidor.matricula,
            });
        }
        const margemMaxima = servidor.salarioBruto * this.MARGEM_MAXIMA;
        const margemUtilizada = await this.margemService.calcularMargemUtilizada(servidor.id);
        if (margemUtilizada + valorParcela > margemMaxima) {
            throw new margem_insuficiente_exception_1.MargemInsuficienteException({
                margem: margemMaxima - margemUtilizada,
                parcela: valorParcela,
                matricula: servidor.matricula,
            });
        }
    }
    calculateInstallment(valor, prazo, taxaMensal) {
        const fator = Math.pow(1 + taxaMensal, prazo);
        return (valor * taxaMensal * fator) / (fator - 1);
    }
    generateInstallments(valor, prazo, taxaMensal, valorParcela) {
        const parcelas = [];
        let saldoDevedor = valor;
        const hoje = new Date();
        for (let i = 1; i <= prazo; i++) {
            const juros = saldoDevedor * taxaMensal;
            const amortizacao = valorParcela - juros;
            saldoDevedor -= amortizacao;
            const vencimento = new Date(hoje);
            vencimento.setMonth(hoje.getMonth() + i);
            parcelas.push({
                numero: i,
                vencimento,
                valorParcela,
                amortizacao,
                juros,
                saldoDevedor: Math.max(0, saldoDevedor),
            });
        }
        return parcelas;
    }
    calculateIOF(valor, prazo) {
        const diasTotais = prazo * 30;
        const iofDiario = valor * this.IOF_DIARIO * diasTotais;
        const iofAdicional = valor * this.IOF_ADICIONAL;
        return iofDiario + iofAdicional;
    }
    calculateCET(valor, valorParcela, prazo, iof) {
        // Implementação do Newton-Raphson para encontrar a taxa CET
        let taxa = 0.02; // Chute inicial
        const precisao = 0.0001;
        const maxIteracoes = 100;
        let iteracao = 0;
        while (iteracao < maxIteracoes) {
            let f = -valor - iof;
            let df = 0;
            for (let i = 1; i <= prazo; i++) {
                f += valorParcela / Math.pow(1 + taxa, i);
                df += (-i * valorParcela) / Math.pow(1 + taxa, i + 1);
            }
            const novaTaxa = taxa - f / df;
            if (Math.abs(novaTaxa - taxa) < precisao) {
                return novaTaxa * 100;
            }
            taxa = novaTaxa;
            iteracao++;
        }
        return taxa * 100;
    }
    calculatePresentValue(valorParcela, prazo, taxaJuros) {
        const taxaMensal = taxaJuros / 100;
        let valorPresente = 0;
        for (let i = 1; i <= prazo; i++) {
            valorPresente += valorParcela / Math.pow(1 + taxaMensal, i);
        }
        return valorPresente;
    }
    calculateRefinanceEconomy(contratoOriginal, novaSimulacao) {
        const totalOriginal = contratoOriginal.parcela * contratoOriginal.prazo;
        const totalNovo = novaSimulacao.valorParcela * novaSimulacao.prazo;
        return totalOriginal - totalNovo;
    }
    calculatePortabilityEconomy(contratoOrigem, novaSimulacao, valorPresenteParcelas) {
        const totalOriginal = contratoOrigem.parcela * contratoOrigem.prazo;
        const totalNovo = novaSimulacao.valorParcela * novaSimulacao.prazo;
        return totalOriginal - totalNovo + (valorPresenteParcelas - contratoOrigem.saldoDevedor);
    }
};
exports.LoanSimulationService = LoanSimulationService;
exports.LoanSimulationService = LoanSimulationService = LoanSimulationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        margem_service_1.MargemService,
        validacao_service_1.ValidacaoService, Object])
], LoanSimulationService);
