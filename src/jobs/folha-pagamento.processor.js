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
exports.FolhaPagamentoProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const integration_service_1 = require("../services/integration.service");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
let FolhaPagamentoProcessor = class FolhaPagamentoProcessor {
    constructor(integrationService, prisma, logger) {
        this.integrationService = integrationService;
        this.prisma = prisma;
        this.logger = logger;
    }
    async processarFolha(job) {
        const { consignanteId, competencia, arquivo } = job.data;
        try {
            this.logger.log('Iniciando processamento de folha', 'FolhaPagamentoProcessor', { jobId: job.id, consignanteId });
            // Atualiza progresso
            await job.progress(10);
            // Importa folha via integração
            const result = await this.integrationService.importarFolhaPagamento(consignanteId, competencia, arquivo);
            if (!result.success) {
                throw new Error(result.error?.message);
            }
            await job.progress(50);
            // Processa dados recebidos
            const folhas = result.data;
            await this.prisma.$transaction(async (tx) => {
                // Remove folhas antigas da competência
                await tx.folhaPagamento.deleteMany({
                    where: {
                        consignanteId,
                        competencia,
                    },
                });
                // Insere novas folhas
                await tx.folhaPagamento.createMany({
                    data: folhas.map(f => ({
                        consignanteId,
                        competencia,
                        matricula: f.matricula,
                        nome: f.nome,
                        cpf: f.cpf,
                        salarioBruto: f.salarioBruto,
                        descontos: f.descontos,
                        salarioLiquido: f.salarioLiquido,
                        margem: f.margem,
                    })),
                });
                // Atualiza margens dos servidores
                for (const folha of folhas) {
                    if (folha.margem) {
                        await tx.servidor.update({
                            where: {
                                matricula_consignanteId: {
                                    matricula: folha.matricula,
                                    consignanteId,
                                },
                            },
                            data: {
                                margemDisponivel: folha.margem,
                                ultimaAtualizacaoMargem: new Date(),
                            },
                        });
                    }
                }
            });
            await job.progress(100);
            this.logger.log('Processamento de folha concluído', 'FolhaPagamentoProcessor', {
                jobId: job.id,
                consignanteId,
                totalProcessado: folhas.length
            });
            return { processados: folhas.length };
        }
        catch (error) {
            this.logger.error('Erro no processamento de folha', error.stack, 'FolhaPagamentoProcessor', { jobId: job.id, consignanteId });
            throw error;
        }
    }
};
exports.FolhaPagamentoProcessor = FolhaPagamentoProcessor;
__decorate([
    (0, bull_1.Process)('processar-folha'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FolhaPagamentoProcessor.prototype, "processarFolha", null);
exports.FolhaPagamentoProcessor = FolhaPagamentoProcessor = __decorate([
    (0, bull_1.Processor)('folha-pagamento'),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], FolhaPagamentoProcessor);
