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
var LoanSimulationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanSimulationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const cache_service_1 = require("../infrastructure/cache/cache.service");
let LoanSimulationService = LoanSimulationService_1 = class LoanSimulationService {
    constructor(prisma, config, cache) {
        this.prisma = prisma;
        this.config = config;
        this.cache = cache;
        this.logger = new common_1.Logger(LoanSimulationService_1.name);
    }
    async simulate(servidorId, consignatariaId, valorSolicitado, prazo) {
        // Valida margem disponível
        const margem = await this.getMargemDisponivel(servidorId);
        if (!margem) {
            throw new Error('Margem não encontrada para o servidor');
        }
        // Busca produto
        const produto = await this.findEligibleProduct(consignatariaId, valorSolicitado, prazo);
        // Calcula simulação
        const simulation = await this.calculateSimulation(valorSolicitado, prazo, produto, margem);
        // Salva simulação
        return this.prisma.loanSimulation.create({
            data: {
                ...simulation,
                servidorId,
                consignatariaId,
            },
        });
    }
    async simulateRefinancing(contratoId, prazo) {
        const contrato = await this.prisma.contract.findUnique({
            where: { id: contratoId },
            include: {
                servidor: true,
                consignataria: true,
            },
        });
        if (!contrato) {
            throw new Error('Contrato não encontrado');
        }
        // Calcula saldo devedor
        const saldoDevedor = await this.calculateSaldoDevedor(contrato);
        // Busca produto para refinanciamento
        const produto = await this.findEligibleProduct(contrato.consignatariaId, saldoDevedor, prazo);
        // Calcula simulação
        const simulation = await this.calculateSimulation(saldoDevedor, prazo, produto, contrato.valorParcela);
        // Calcula economia
        const economiaTotal = this.calculateRefinancingEconomy(contrato, simulation);
        return {
            ...simulation,
            contratoId,
            saldoDevedor,
            valorLiquidacao: saldoDevedor,
            valorDisponivel: simulation.valorTotal - saldoDevedor,
            economiaTotal,
        };
    }
    async simulatePortability(contratoOrigemId, consignatariaDestinoId, prazo) {
        const contratoOrigem = await this.prisma.contract.findUnique({
            where: { id: contratoOrigemId },
            include: {
                servidor: true,
                consignataria: true,
            },
        });
        if (!contratoOrigem) {
            throw new Error('Contrato de origem não encontrado');
        }
        // Calcula saldo devedor
        const saldoDevedor = await this.calculateSaldoDevedor(contratoOrigem);
        // Busca produto para portabilidade
        const produto = await this.findEligibleProduct(consignatariaDestinoId, saldoDevedor, prazo);
        // Calcula simulação
        const simulation = await this.calculateSimulation(saldoDevedor, prazo, produto, contratoOrigem.valorParcela);
        // Calcula valor presente das parcelas
        const valorPresenteParcelas = this.calculatePresentValue(contratoOrigem.valorParcela, contratoOrigem.parcelasRestantes, contratoOrigem.taxaJuros);
        // Calcula economia
        const economiaTotal = this.calculatePortabilityEconomy(contratoOrigem, simulation);
        return {
            ...simulation,
            contratoOrigemId,
            bancoOrigemId: contratoOrigem.consignatariaId,
            saldoDevedor,
            valorPresenteParcelas,
            economiaTotal,
        };
    }
    async getMargemDisponivel(servidorId) {
        const margem = await this.prisma.margem.findFirst({
            where: { servidorId },
            orderBy: { competencia: 'desc' },
        });
        return margem?.disponivel || 0;
    }
    async findEligibleProduct(consignatariaId, valor, prazo) {
        const produto = await this.prisma.loanProduct.findFirst({
            where: {
                consignatariaId,
                valorMinimo: { lte: valor },
                valorMaximo: { gte: valor },
                prazoMinimo: { lte: prazo },
                prazoMaximo: { gte: prazo },
                active: true,
            },
        });
        if (!produto) {
            throw new Error('Nenhum produto encontrado com os critérios informados');
        }
        return produto;
    }
    async calculateSimulation(valor, prazo, produto, margemMaxima) {
        // Calcula IOF
        const iof = this.calculateIOF(valor, prazo, produto.taxaIof);
        // Calcula valor total com IOF e tarifas
        const valorTotal = valor + iof + this.sumFees(produto.tarifas);
        // Calcula parcela usando Price
        const valorParcela = this.calculatePMT(valorTotal, prazo, produto.taxaJuros);
        // Valida margem
        if (valorParcela > margemMaxima) {
            throw new Error('Valor da parcela excede a margem disponível');
        }
        // Calcula CET
        const cet = this.calculateCET(valor, valorParcela, prazo, produto.tarifas, iof);
        // Gera tabela Price
        const parcelas = this.generateAmortizationTable(valorTotal, prazo, produto.taxaJuros, valorParcela);
        return {
            id: crypto.randomUUID(),
            valorSolicitado: valor,
            prazo,
            taxaJuros: produto.taxaJuros,
            valorParcela,
            valorTotal,
            cet,
            iof,
            tarifas: produto.tarifas,
            parcelas,
            createdAt: new Date(),
        };
    }
    calculateIOF(valor, prazo, taxa) {
        // Implementar cálculo de IOF conforme regulamentação
        const iofDiario = valor * 0.0082 * prazo;
        const iofAdicional = valor * 0.0038;
        return iofDiario + iofAdicional;
    }
    sumFees(tarifas) {
        return tarifas.reduce((sum, fee) => sum + fee.valor, 0);
    }
    calculatePMT(valor, prazo, taxaJuros) {
        const taxa = taxaJuros / 100;
        return ((valor * taxa * Math.pow(1 + taxa, prazo)) /
            (Math.pow(1 + taxa, prazo) - 1));
    }
    calculateCET(valor, parcela, prazo, tarifas, iof) {
        // Implementar cálculo do CET usando Newton-Raphson
        let cet = taxaJuros;
        const tolerance = 0.0001;
        let iteration = 0;
        while (iteration < 100) {
            const f = this.calculateNPV(valor, parcela, prazo, cet);
            const df = this.calculateNPVDerivative(valor, parcela, prazo, cet);
            const delta = f / df;
            cet = cet - delta;
            if (Math.abs(delta) < tolerance) {
                break;
            }
            iteration++;
        }
        return cet * 100;
    }
    calculateNPV(valor, parcela, prazo, taxa) {
        let npv = -valor;
        for (let i = 1; i <= prazo; i++) {
            npv += parcela / Math.pow(1 + taxa, i);
        }
        return npv;
    }
    calculateNPVDerivative(valor, parcela, prazo, taxa) {
        let derivative = 0;
        for (let i = 1; i <= prazo; i++) {
            derivative -= (i * parcela) / Math.pow(1 + taxa, i + 1);
        }
        return derivative;
    }
    generateAmortizationTable(valor, prazo, taxaJuros, valorParcela) {
        const parcelas = [];
        let saldoDevedor = valor;
        const taxa = taxaJuros / 100;
        for (let i = 1; i <= prazo; i++) {
            const juros = saldoDevedor * taxa;
            const amortizacao = valorParcela - juros;
            saldoDevedor -= amortizacao;
            parcelas.push({
                numero: i,
                vencimento: this.calculateDueDate(i),
                valorParcela,
                amortizacao,
                juros,
                saldoDevedor: Math.max(0, saldoDevedor),
            });
        }
        return parcelas;
    }
    calculateDueDate(parcela) {
        const date = new Date();
        date.setMonth(date.getMonth() + parcela);
        return date;
    }
    async calculateSaldoDevedor(contrato) {
        const parcelasPagas = await this.prisma.desconto.count({
            where: {
                contratoId: contrato.id,
                status: 'PAID',
            },
        });
        return this.calculateRemainingBalance(contrato.valorTotal, contrato.valorParcela, contrato.numeroParcelas, parcelasPagas, contrato.taxaJuros);
    }
    calculateRemainingBalance(valorTotal, valorParcela, totalParcelas, parcelasPagas, taxaJuros) {
        const taxa = taxaJuros / 100;
        let saldoDevedor = valorTotal;
        for (let i = 0; i < parcelasPagas; i++) {
            const juros = saldoDevedor * taxa;
            const amortizacao = valorParcela - juros;
            saldoDevedor -= amortizacao;
        }
        return Math.max(0, saldoDevedor);
    }
    calculatePresentValue(valorParcela, prazo, taxaJuros) {
        const taxa = taxaJuros / 100;
        let vp = 0;
        for (let i = 1; i <= prazo; i++) {
            vp += valorParcela / Math.pow(1 + taxa, i);
        }
        return vp;
    }
    calculateRefinancingEconomy(contratoAtual, simulacao) {
        const totalAtual = contratoAtual.valorParcela * contratoAtual.parcelasRestantes;
        const totalNovo = simulacao.valorParcela * simulacao.prazo;
        return totalAtual - totalNovo;
    }
    calculatePortabilityEconomy(contratoOrigem, simulacao) {
        const totalOrigem = contratoOrigem.valorParcela * contratoOrigem.parcelasRestantes;
        const totalDestino = simulacao.valorParcela * simulacao.prazo;
        return totalOrigem - totalDestino;
    }
};
exports.LoanSimulationService = LoanSimulationService;
exports.LoanSimulationService = LoanSimulationService = LoanSimulationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        cache_service_1.CacheService])
], LoanSimulationService);
