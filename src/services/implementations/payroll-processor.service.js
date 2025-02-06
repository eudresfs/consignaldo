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
var PayrollProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollProcessorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const margem_service_1 = require("../margem.service");
const notification_service_1 = require("../notification.service");
const payroll_interface_1 = require("../../domain/interfaces/payroll.interface");
const margem_insuficiente_exception_1 = require("../../exceptions/margem-insuficiente.exception");
let PayrollProcessorService = PayrollProcessorService_1 = class PayrollProcessorService {
    constructor(prisma, margemService, notificationService) {
        this.prisma = prisma;
        this.margemService = margemService;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(PayrollProcessorService_1.name);
    }
    async processRecord(record) {
        const servidor = await this.findOrCreateServidor(record);
        await this.updateMargens(servidor.id, record);
        await this.processDescontos(servidor.id, record.descontos);
    }
    async reconcilePayroll(payrollId) {
        const reconciliations = [];
        const contratos = await this.getActiveContracts(payrollId);
        for (const contrato of contratos) {
            const reconciliation = await this.reconcileContract(payrollId, contrato);
            reconciliations.push(reconciliation);
            await this.handleReconciliationAction(reconciliation);
        }
        return reconciliations;
    }
    async findOrCreateServidor(record) {
        const servidor = await this.prisma.servidor.findFirst({
            where: {
                OR: [
                    { matricula: record.matricula },
                    { cpf: record.cpf },
                ],
            },
        });
        if (servidor) {
            return this.prisma.servidor.update({
                where: { id: servidor.id },
                data: {
                    nome: record.nome,
                    salarioBruto: record.salarioBruto,
                    salarioLiquido: record.salarioLiquido,
                    updatedAt: new Date(),
                },
            });
        }
        return this.prisma.servidor.create({
            data: {
                matricula: record.matricula,
                cpf: record.cpf,
                nome: record.nome,
                salarioBruto: record.salarioBruto,
                salarioLiquido: record.salarioLiquido,
            },
        });
    }
    async updateMargens(servidorId, record) {
        try {
            await this.margemService.atualizarMargem({
                servidorId,
                margemDisponivel: record.margemDisponivel,
                margemUtilizada: record.margemUtilizada,
            });
        }
        catch (error) {
            if (error instanceof margem_insuficiente_exception_1.MargemInsuficienteException) {
                await this.notificationService.notifyMargemInsuficiente({
                    servidorId,
                    margem: record.margemDisponivel,
                    margemNecessaria: error.margemNecessaria,
                });
            }
            throw error;
        }
    }
    async processDescontos(servidorId, descontos) {
        for (const desconto of descontos) {
            if (desconto.contratoId) {
                await this.processContratoDesconto(servidorId, desconto);
            }
            else {
                await this.processOutroDesconto(servidorId, desconto);
            }
        }
    }
    async processContratoDesconto(servidorId, desconto) {
        const contrato = await this.prisma.contrato.findUnique({
            where: { id: desconto.contratoId },
        });
        if (!contrato) {
            this.logger.warn(`Contrato ${desconto.contratoId} não encontrado para desconto`);
            return;
        }
        await this.prisma.descontoContrato.create({
            data: {
                contratoId: desconto.contratoId,
                servidorId,
                valor: desconto.valor,
                competencia: new Date().toISOString().slice(0, 7),
            },
        });
    }
    async processOutroDesconto(servidorId, desconto) {
        await this.prisma.outroDesconto.create({
            data: {
                servidorId,
                codigo: desconto.codigo,
                descricao: desconto.descricao,
                valor: desconto.valor,
                consignatariaId: desconto.consignatariaId,
                competencia: new Date().toISOString().slice(0, 7),
            },
        });
    }
    async getActiveContracts(payrollId) {
        const payroll = await this.prisma.payrollImport.findUnique({
            where: { id: payrollId },
            include: { consignante: true },
        });
        return this.prisma.contrato.findMany({
            where: {
                servidor: {
                    consignanteId: payroll.consignanteId,
                },
                status: 'AVERBADO',
            },
            include: {
                servidor: true,
                consignataria: true,
            },
        });
    }
    async reconcileContract(payrollId, contrato) {
        const descontos = await this.prisma.descontoContrato.findMany({
            where: {
                contratoId: contrato.id,
                payrollImportId: payrollId,
            },
        });
        const actualValue = descontos.reduce((sum, d) => sum + d.valor, 0);
        const difference = Math.abs(contrato.parcela - actualValue);
        let status;
        let action;
        if (actualValue === 0) {
            status = payroll_interface_1.ReconciliationStatus.MISSING;
            action = payroll_interface_1.ReconciliationAction.NOTIFY;
        }
        else if (difference > 0.01) { // Tolerância de 1 centavo
            status = payroll_interface_1.ReconciliationStatus.DIVERGENT;
            action = this.determineAction(difference, contrato.parcela);
        }
        else {
            status = payroll_interface_1.ReconciliationStatus.MATCHED;
            action = payroll_interface_1.ReconciliationAction.NONE;
        }
        return this.prisma.payrollReconciliation.create({
            data: {
                payrollId,
                contractId: contrato.id,
                status,
                expectedValue: contrato.parcela,
                actualValue,
                difference,
                action,
            },
        });
    }
    determineAction(difference, parcela) {
        const percentDifference = (difference / parcela) * 100;
        if (percentDifference > 10) { // Diferença maior que 10%
            return payroll_interface_1.ReconciliationAction.SUSPEND;
        }
        else if (percentDifference > 5) { // Diferença maior que 5%
            return payroll_interface_1.ReconciliationAction.UPDATE;
        }
        else {
            return payroll_interface_1.ReconciliationAction.NOTIFY;
        }
    }
    async handleReconciliationAction(reconciliation) {
        switch (reconciliation.action) {
            case payroll_interface_1.ReconciliationAction.SUSPEND:
                await this.suspendContract(reconciliation);
                break;
            case payroll_interface_1.ReconciliationAction.UPDATE:
                await this.updateContractValue(reconciliation);
                break;
            case payroll_interface_1.ReconciliationAction.NOTIFY:
                await this.notifyReconciliation(reconciliation);
                break;
        }
    }
    async suspendContract(reconciliation) {
        await this.prisma.contrato.update({
            where: { id: reconciliation.contractId },
            data: { status: 'SUSPENSO' },
        });
        await this.notificationService.notifyContractSuspension({
            reconciliationId: reconciliation.id,
            reason: 'Divergência significativa no valor da parcela',
        });
    }
    async updateContractValue(reconciliation) {
        await this.prisma.contrato.update({
            where: { id: reconciliation.contractId },
            data: { parcela: reconciliation.actualValue },
        });
        await this.notificationService.notifyContractUpdate({
            reconciliationId: reconciliation.id,
            oldValue: reconciliation.expectedValue,
            newValue: reconciliation.actualValue,
        });
    }
    async notifyReconciliation(reconciliation) {
        await this.notificationService.notifyReconciliationIssue({
            reconciliationId: reconciliation.id,
            status: reconciliation.status,
            difference: reconciliation.difference,
        });
    }
};
exports.PayrollProcessorService = PayrollProcessorService;
exports.PayrollProcessorService = PayrollProcessorService = PayrollProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        margem_service_1.MargemService,
        notification_service_1.NotificationService])
], PayrollProcessorService);
