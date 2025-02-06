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
var LoanProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanProcessorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const margem_service_1 = require("../margem.service");
const validacao_service_1 = require("../validacao.service");
const notification_service_1 = require("../notification.service");
const bank_integration_service_1 = require("../bank-integration.service");
const status_contrato_enum_1 = require("../../domain/enums/status-contrato.enum");
const margem_insuficiente_exception_1 = require("../../exceptions/margem-insuficiente.exception");
const prazo_invalido_exception_1 = require("../../exceptions/prazo-invalido.exception");
let LoanProcessorService = LoanProcessorService_1 = class LoanProcessorService {
    constructor(prisma, margemService, validacaoService, notificationService, bankIntegration) {
        this.prisma = prisma;
        this.margemService = margemService;
        this.validacaoService = validacaoService;
        this.notificationService = notificationService;
        this.bankIntegration = bankIntegration;
        this.logger = new common_1.Logger(LoanProcessorService_1.name);
        this.MARGEM_MAXIMA = 0.3; // 30% do salário
    }
    async processNewLoan(simulacao) {
        const servidor = await this.prisma.servidor.findUnique({
            where: { id: simulacao.servidorId },
        });
        await this.validarMargem(servidor, simulacao.valorParcela);
        await this.validarProduto(simulacao);
        const proposta = await this.criarProposta(simulacao);
        await this.bankIntegration.exportProposal(proposta.id);
        return proposta;
    }
    async processRefinance(simulacao) {
        const contratoOriginal = await this.prisma.contrato.findUnique({
            where: { id: simulacao.contratoId },
            include: { servidor: true },
        });
        if (!contratoOriginal) {
            throw new Error('Contrato original não encontrado');
        }
        await this.validarContratoRefinanciamento(contratoOriginal);
        await this.validarMargem(contratoOriginal.servidor, simulacao.valorParcela - contratoOriginal.parcela);
        const proposta = await this.criarPropostaRefinanciamento(simulacao, contratoOriginal);
        await this.bankIntegration.exportProposal(proposta.id);
        return proposta;
    }
    async processPortability(simulacao) {
        const contratoOrigem = await this.prisma.contrato.findUnique({
            where: { id: simulacao.contratoOrigemId },
            include: { servidor: true },
        });
        if (!contratoOrigem) {
            throw new Error('Contrato de origem não encontrado');
        }
        await this.validarContratoPortabilidade(contratoOrigem);
        await this.validarMargem(contratoOrigem.servidor, simulacao.valorParcela - contratoOrigem.parcela);
        const proposta = await this.criarPropostaPortabilidade(simulacao, contratoOrigem);
        await this.bankIntegration.exportProposal(proposta.id);
        return proposta;
    }
    async validarMargem(servidor, valorParcela) {
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
    async validarProduto(simulacao) {
        const produto = await this.prisma.produto.findFirst({
            where: {
                consignatariaId: simulacao.consignatariaId,
                prazoMinimo: { lte: simulacao.prazo },
                prazoMaximo: { gte: simulacao.prazo },
                valorMinimo: { lte: simulacao.valorSolicitado },
                valorMaximo: { gte: simulacao.valorSolicitado },
                active: true,
            },
        });
        if (!produto) {
            throw new prazo_invalido_exception_1.PrazoInvalidoException({
                prazo: simulacao.prazo,
                valor: simulacao.valorSolicitado,
            });
        }
        if (Math.abs(produto.taxaJuros - simulacao.taxaJuros) > 0.0001) {
            throw new Error('Taxa de juros divergente do produto');
        }
    }
    async validarContratoRefinanciamento(contrato) {
        if (contrato.status !== status_contrato_enum_1.StatusContrato.AVERBADO) {
            throw new Error('Contrato não está ativo para refinanciamento');
        }
        const parcelasRestantes = await this.prisma.parcela.count({
            where: {
                contratoId: contrato.id,
                status: 'ABERTO',
            },
        });
        if (parcelasRestantes < 6) {
            throw new Error('Contrato deve ter no mínimo 6 parcelas em aberto');
        }
    }
    async validarContratoPortabilidade(contrato) {
        if (contrato.status !== status_contrato_enum_1.StatusContrato.AVERBADO) {
            throw new Error('Contrato não está ativo para portabilidade');
        }
        const parcelasRestantes = await this.prisma.parcela.count({
            where: {
                contratoId: contrato.id,
                status: 'ABERTO',
            },
        });
        if (parcelasRestantes < 12) {
            throw new Error('Contrato deve ter no mínimo 12 parcelas em aberto');
        }
    }
    async criarProposta(simulacao) {
        return this.prisma.proposta.create({
            data: {
                tipo: 'NOVO',
                status: 'AGUARDANDO',
                servidorId: simulacao.servidorId,
                consignatariaId: simulacao.consignatariaId,
                valorSolicitado: simulacao.valorSolicitado,
                prazo: simulacao.prazo,
                taxaJuros: simulacao.taxaJuros,
                valorParcela: simulacao.valorParcela,
                valorTotal: simulacao.valorTotal,
                cet: simulacao.cet,
                iof: simulacao.iof,
                tarifas: {
                    create: simulacao.tarifas.map(t => ({
                        descricao: t.descricao,
                        valor: t.valor,
                    })),
                },
                parcelas: {
                    create: simulacao.parcelas.map(p => ({
                        numero: p.numero,
                        vencimento: p.vencimento,
                        valorParcela: p.valorParcela,
                        amortizacao: p.amortizacao,
                        juros: p.juros,
                        saldoDevedor: p.saldoDevedor,
                    })),
                },
            },
        });
    }
    async criarPropostaRefinanciamento(simulacao, contratoOriginal) {
        return this.prisma.proposta.create({
            data: {
                tipo: 'REFINANCIAMENTO',
                status: 'AGUARDANDO',
                servidorId: simulacao.servidorId,
                consignatariaId: simulacao.consignatariaId,
                contratoOrigemId: contratoOriginal.id,
                valorSolicitado: simulacao.valorSolicitado,
                prazo: simulacao.prazo,
                taxaJuros: simulacao.taxaJuros,
                valorParcela: simulacao.valorParcela,
                valorTotal: simulacao.valorTotal,
                cet: simulacao.cet,
                iof: simulacao.iof,
                saldoDevedor: simulacao.saldoDevedor,
                valorLiquidacao: simulacao.valorLiquidacao,
                valorDisponivel: simulacao.valorDisponivel,
                economiaTotal: simulacao.economiaTotal,
                tarifas: {
                    create: simulacao.tarifas.map(t => ({
                        descricao: t.descricao,
                        valor: t.valor,
                    })),
                },
                parcelas: {
                    create: simulacao.parcelas.map(p => ({
                        numero: p.numero,
                        vencimento: p.vencimento,
                        valorParcela: p.valorParcela,
                        amortizacao: p.amortizacao,
                        juros: p.juros,
                        saldoDevedor: p.saldoDevedor,
                    })),
                },
            },
        });
    }
    async criarPropostaPortabilidade(simulacao, contratoOrigem) {
        return this.prisma.proposta.create({
            data: {
                tipo: 'PORTABILIDADE',
                status: 'AGUARDANDO',
                servidorId: simulacao.servidorId,
                consignatariaId: simulacao.consignatariaId,
                contratoOrigemId: contratoOrigem.id,
                bancoOrigemId: simulacao.bancoOrigemId,
                valorSolicitado: simulacao.valorSolicitado,
                prazo: simulacao.prazo,
                taxaJuros: simulacao.taxaJuros,
                valorParcela: simulacao.valorParcela,
                valorTotal: simulacao.valorTotal,
                cet: simulacao.cet,
                iof: simulacao.iof,
                saldoDevedor: simulacao.saldoDevedor,
                valorPresenteParcelas: simulacao.valorPresenteParcelas,
                economiaTotal: simulacao.economiaTotal,
                tarifas: {
                    create: simulacao.tarifas.map(t => ({
                        descricao: t.descricao,
                        valor: t.valor,
                    })),
                },
                parcelas: {
                    create: simulacao.parcelas.map(p => ({
                        numero: p.numero,
                        vencimento: p.vencimento,
                        valorParcela: p.valorParcela,
                        amortizacao: p.amortizacao,
                        juros: p.juros,
                        saldoDevedor: p.saldoDevedor,
                    })),
                },
            },
        });
    }
};
exports.LoanProcessorService = LoanProcessorService;
exports.LoanProcessorService = LoanProcessorService = LoanProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        margem_service_1.MargemService,
        validacao_service_1.ValidacaoService,
        notification_service_1.NotificationService,
        bank_integration_service_1.BankIntegrationService])
], LoanProcessorService);
