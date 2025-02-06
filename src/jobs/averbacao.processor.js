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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const integration_service_1 = require("../services/integration.service");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
const averbacao_enum_1 = require("../domain/enums/averbacao.enum");
let AverbacaoProcessor = class AverbacaoProcessor {
    constructor(integrationService, prisma, logger) {
        this.integrationService = integrationService;
        this.prisma = prisma;
        this.logger = logger;
    }
    async processarAverbacao(job) {
        const { consignanteId, matricula, contrato, parcela, prazo } = job.data;
        try {
            this.logger.log('Iniciando processamento de averbação', 'AverbacaoProcessor', { jobId: job.id, contrato });
            await job.progress(10);
            // Busca dados do contrato
            const contratoDb = await this.prisma.contrato.findUnique({
                where: { numero: contrato },
                include: {
                    servidor: true,
                    consignataria: true,
                },
            });
            if (!contratoDb) {
                throw new Error(`Contrato ${contrato} não encontrado`);
            }
            await job.progress(30);
            // Realiza averbação via integração
            const result = await this.integrationService.averbarContrato(consignanteId, {
                matricula,
                contrato,
                parcela,
                prazo,
                dataInicio: new Date(),
                banco: contratoDb.consignataria.codigo,
                situacao: 'PENDENTE',
            });
            if (!result.success) {
                throw new Error(result.error?.message);
            }
            await job.progress(70);
            // Atualiza status do contrato
            await this.prisma.contrato.update({
                where: { numero: contrato },
                data: {
                    status: averbacao_enum_1.AverbacaoStatus.AVERBADO,
                    dataAverbacao: new Date(),
                    observacao: 'Averbação realizada com sucesso',
                },
            });
            // Atualiza margem do servidor
            await this.prisma.servidor.update({
                where: {
                    matricula_consignanteId: {
                        matricula,
                        consignanteId,
                    },
                },
                data: {
                    margemDisponivel: {
                        decrement: parcela,
                    },
                },
            });
            await job.progress(100);
            this.logger.log('Processamento de averbação concluído', 'AverbacaoProcessor', { jobId: job.id, contrato });
            return { contrato, status: 'AVERBADO' };
        }
        catch (error) {
            this.logger.error('Erro no processamento de averbação', error.stack, 'AverbacaoProcessor', { jobId: job.id, contrato });
            // Atualiza status do contrato para erro
            await this.prisma.contrato.update({
                where: { numero: contrato },
                data: {
                    status: averbacao_enum_1.AverbacaoStatus.ERRO,
                    observacao: `Erro na averbação: ${error.message}`,
                },
            });
            throw error;
        }
    }
};
exports.AverbacaoProcessor = AverbacaoProcessor;
__decorate([
    (0, bull_1.Process)('processar-averbacao'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AverbacaoProcessor.prototype, "processarAverbacao", null);
exports.AverbacaoProcessor = AverbacaoProcessor = __decorate([
    (0, bull_1.Processor)('averbacao'),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], AverbacaoProcessor);
