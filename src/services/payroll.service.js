"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PayrollService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const storage_service_1 = require("../infrastructure/storage/storage.service");
const queue_service_1 = require("../infrastructure/queue/queue.service");
const notification_service_1 = require("./notification.service");
const payroll_interface_1 = require("../domain/interfaces/payroll.interface");
const csv = __importStar(require("csv-parse"));
const iconv = __importStar(require("iconv-lite"));
const stream_1 = require("stream");
let PayrollService = PayrollService_1 = class PayrollService {
    constructor(prisma, config, storage, queue, notification) {
        this.prisma = prisma;
        this.config = config;
        this.storage = storage;
        this.queue = queue;
        this.notification = notification;
        this.logger = new common_1.Logger(PayrollService_1.name);
    }
    async importPayroll(consignanteId, file, competencia) {
        const template = await this.getPayrollTemplate(consignanteId);
        const import_ = await this.prisma.payrollImport.create({
            data: {
                consignanteId,
                competencia,
                fileName: file.originalname,
                status: payroll_interface_1.PayrollStatus.PENDING,
                totalRecords: 0,
                processedRecords: 0,
            },
        });
        // Upload do arquivo
        const filePath = `payroll/${consignanteId}/${import_.id}/${file.originalname}`;
        await this.storage.upload(filePath, file.buffer);
        // Inicia processamento assíncrono
        await this.queue.add('process-payroll', {
            importId: import_.id,
            filePath,
            template,
        });
        return import_;
    }
    async processPayroll(importId) {
        const import_ = await this.prisma.payrollImport.findUnique({
            where: { id: importId },
            include: { template: true },
        });
        if (!import_) {
            throw new Error(`Import ${importId} not found`);
        }
        try {
            await this.updateImportStatus(importId, payroll_interface_1.PayrollStatus.PROCESSING);
            const fileBuffer = await this.storage.download(import_.filePath);
            const records = await this.parsePayrollFile(fileBuffer, import_.template);
            let processedRecords = 0;
            const errors = [];
            for (const record of records) {
                try {
                    await this.processPayrollRecord(record, import_);
                    processedRecords++;
                }
                catch (error) {
                    errors.push({
                        line: processedRecords + 1,
                        error: error.message,
                    });
                }
                if (processedRecords % 100 === 0) {
                    await this.updateProcessedRecords(importId, processedRecords);
                }
            }
            const status = errors.length > 0 ? payroll_interface_1.PayrollStatus.ERROR : payroll_interface_1.PayrollStatus.COMPLETED;
            await this.finalizeImport(importId, status, processedRecords, errors);
            // Inicia reconciliação
            await this.queue.add('reconcile-payroll', { importId });
        }
        catch (error) {
            this.logger.error(`Error processing payroll ${importId}:`, error);
            await this.updateImportStatus(importId, payroll_interface_1.PayrollStatus.ERROR);
            throw error;
        }
    }
    async reconcilePayroll(importId) {
        const import_ = await this.prisma.payrollImport.findUnique({
            where: { id: importId },
            include: {
                records: {
                    include: {
                        descontos: true,
                    },
                },
            },
        });
        if (!import_) {
            throw new Error(`Import ${importId} not found`);
        }
        const reconciliations = [];
        // Busca contratos ativos
        const contracts = await this.prisma.contract.findMany({
            where: {
                status: 'ACTIVE',
                consignanteId: import_.consignanteId,
            },
        });
        for (const contract of contracts) {
            const record = import_.records.find(r => r.descontos.some(d => d.contratoId === contract.id));
            const reconciliation = await this.reconcileContract(contract, record);
            reconciliations.push(reconciliation);
            if (reconciliation.status !== payroll_interface_1.ReconciliationStatus.MATCHED) {
                await this.handleReconciliationAction(reconciliation);
            }
        }
        return reconciliations;
    }
    async getPayrollTemplate(consignanteId) {
        const template = await this.prisma.payrollTemplate.findFirst({
            where: {
                consignanteId,
                active: true,
            },
        });
        if (!template) {
            throw new Error(`No active template found for consignante ${consignanteId}`);
        }
        return template;
    }
    async parsePayrollFile(buffer, template) {
        const content = iconv.decode(buffer, template.encoding);
        const records = [];
        return new Promise((resolve, reject) => {
            const parser = csv.parse({
                delimiter: template.delimiter,
                from_line: template.skipLines + 1,
                columns: template.columns.map(c => c.name),
            });
            const stream = stream_1.Readable.from(content);
            stream.pipe(parser);
            parser.on('readable', () => {
                let record;
                while ((record = parser.read())) {
                    records.push(this.validateAndTransformRecord(record, template));
                }
            });
            parser.on('error', reject);
            parser.on('end', () => resolve(records));
        });
    }
    validateAndTransformRecord(record, template) {
        const transformed = {};
        for (const column of template.columns) {
            const value = record[column.name];
            if (column.required && !value) {
                throw new Error(`Required column ${column.name} is empty`);
            }
            if (column.type === 'number') {
                transformed[column.name] = this.parseNumber(value);
            }
            else if (column.type === 'date') {
                transformed[column.name] = this.parseDate(value, column.format);
            }
            else {
                transformed[column.name] = value;
            }
            if (column.validation) {
                this.validateField(column.name, transformed[column.name], column.validation);
            }
        }
        return transformed;
    }
    parseNumber(value) {
        return Number(value.replace(/[^\d,-]/g, '').replace(',', '.'));
    }
    parseDate(value, format) {
        // Implementar parse de data baseado no formato
        return new Date(value);
    }
    validateField(field, value, validation) {
        // Implementar validações customizadas
        const validations = {
            cpf: (v) => /^\d{11}$/.test(v),
            matricula: (v) => v.length >= 5,
            // Adicionar outras validações
        };
        if (validations[validation] && !validations[validation](value)) {
            throw new Error(`Invalid ${field}: ${value}`);
        }
    }
    async processPayrollRecord(record, import_) {
        // Atualiza ou cria servidor
        const servidor = await this.prisma.servidor.upsert({
            where: { cpf: record.cpf },
            update: {
                nome: record.nome,
                salarioBruto: record.salarioBruto,
                salarioLiquido: record.salarioLiquido,
            },
            create: {
                cpf: record.cpf,
                nome: record.nome,
                matricula: record.matricula,
                salarioBruto: record.salarioBruto,
                salarioLiquido: record.salarioLiquido,
            },
        });
        // Atualiza margem
        await this.prisma.margem.create({
            data: {
                servidorId: servidor.id,
                competencia: import_.competencia,
                disponivel: record.margemDisponivel,
                utilizada: record.margemUtilizada,
                importId: import_.id,
            },
        });
        // Processa descontos
        for (const desconto of record.descontos) {
            await this.prisma.desconto.create({
                data: {
                    servidorId: servidor.id,
                    competencia: import_.competencia,
                    codigo: desconto.codigo,
                    descricao: desconto.descricao,
                    valor: desconto.valor,
                    consignatariaId: desconto.consignatariaId,
                    contratoId: desconto.contratoId,
                    importId: import_.id,
                },
            });
        }
    }
    async reconcileContract(contract, record) {
        const desconto = record?.descontos.find(d => d.contratoId === contract.id);
        let status;
        let action;
        if (!desconto) {
            status = payroll_interface_1.ReconciliationStatus.MISSING;
            action = payroll_interface_1.ReconciliationAction.NOTIFY;
        }
        else if (Math.abs(desconto.valor - contract.valorParcela) > 0.01) {
            status = payroll_interface_1.ReconciliationStatus.DIVERGENT;
            action = payroll_interface_1.ReconciliationAction.UPDATE;
        }
        else {
            status = payroll_interface_1.ReconciliationStatus.MATCHED;
            action = payroll_interface_1.ReconciliationAction.NONE;
        }
        return {
            id: crypto.randomUUID(),
            payrollId: record?.id,
            contractId: contract.id,
            status,
            expectedValue: contract.valorParcela,
            actualValue: desconto?.valor || 0,
            difference: (desconto?.valor || 0) - contract.valorParcela,
            action,
        };
    }
    async handleReconciliationAction(reconciliation) {
        switch (reconciliation.action) {
            case payroll_interface_1.ReconciliationAction.UPDATE:
                await this.updateContractValue(reconciliation);
                break;
            case payroll_interface_1.ReconciliationAction.SUSPEND:
                await this.suspendContract(reconciliation.contractId);
                break;
            case payroll_interface_1.ReconciliationAction.NOTIFY:
                await this.notifyReconciliationIssue(reconciliation);
                break;
        }
    }
    async updateContractValue(reconciliation) {
        await this.prisma.contract.update({
            where: { id: reconciliation.contractId },
            data: {
                valorParcela: reconciliation.actualValue,
                observacoes: `Valor atualizado após reconciliação da folha. Diferença: ${reconciliation.difference}`,
            },
        });
    }
    async suspendContract(contractId) {
        await this.prisma.contract.update({
            where: { id: contractId },
            data: {
                status: 'SUSPENDED',
                observacoes: 'Contrato suspenso após não localização na folha de pagamento',
            },
        });
    }
    async notifyReconciliationIssue(reconciliation) {
        await this.notification.send({
            type: 'RECONCILIATION_ISSUE',
            recipients: ['gestor'],
            data: {
                contractId: reconciliation.contractId,
                status: reconciliation.status,
                difference: reconciliation.difference,
            },
        });
    }
    async updateImportStatus(importId, status) {
        await this.prisma.payrollImport.update({
            where: { id: importId },
            data: { status },
        });
    }
    async updateProcessedRecords(importId, processedRecords) {
        await this.prisma.payrollImport.update({
            where: { id: importId },
            data: { processedRecords },
        });
    }
    async finalizeImport(importId, status, processedRecords, errors) {
        await this.prisma.payrollImport.update({
            where: { id: importId },
            data: {
                status,
                processedRecords,
                errors,
                finishedAt: new Date(),
            },
        });
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = PayrollService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        storage_service_1.StorageService,
        queue_service_1.QueueService,
        notification_service_1.NotificationService])
], PayrollService);
