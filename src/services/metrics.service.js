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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
let MetricsService = class MetricsService {
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    async getIntegrationMetrics(consignanteId, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const where = {
            timestamp: {
                gte: startDate,
            },
            ...(consignanteId && { consignanteId }),
        };
        const [totalRequests, successRate, avgDuration, errorsByType,] = await Promise.all([
            // Total de requisições
            this.prisma.integrationLog.count({ where }),
            // Taxa de sucesso
            this.prisma.integrationLog.aggregate({
                where,
                _avg: {
                    success: true,
                },
            }),
            // Duração média
            this.prisma.integrationLog.aggregate({
                where: { ...where, success: true },
                _avg: {
                    duration: true,
                },
            }),
            // Erros por tipo
            this.prisma.integrationLog.groupBy({
                by: ['errorCode'],
                where: { ...where, success: false },
                _count: true,
            }),
        ]);
        return {
            period: {
                start: startDate,
                end: new Date(),
            },
            metrics: {
                totalRequests,
                successRate: successRate._avg.success * 100,
                avgDuration: avgDuration._avg.duration,
                errorsByType: errorsByType.reduce((acc, curr) => ({
                    ...acc,
                    [curr.errorCode]: curr._count,
                }), {}),
            },
        };
    }
    async getPerformanceMetrics(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [processedFolhas, processedAverbacoes, avgProcessingTime, queueMetrics,] = await Promise.all([
            // Total de folhas processadas
            this.prisma.folhaPagamento.count({
                where: {
                    createdAt: {
                        gte: startDate,
                    },
                },
            }),
            // Total de averbações processadas
            this.prisma.contrato.count({
                where: {
                    dataAverbacao: {
                        gte: startDate,
                    },
                },
            }),
            // Tempo médio de processamento
            this.prisma.jobLog.aggregate({
                where: {
                    completedAt: {
                        gte: startDate,
                    },
                },
                _avg: {
                    duration: true,
                },
            }),
            // Métricas de fila
            this.prisma.jobLog.groupBy({
                by: ['status'],
                where: {
                    createdAt: {
                        gte: startDate,
                    },
                },
                _count: true,
            }),
        ]);
        return {
            period: {
                start: startDate,
                end: new Date(),
            },
            metrics: {
                processedFolhas,
                processedAverbacoes,
                avgProcessingTime: avgProcessingTime._avg.duration,
                queueStatus: queueMetrics.reduce((acc, curr) => ({
                    ...acc,
                    [curr.status]: curr._count,
                }), {}),
            },
        };
    }
    async getSystemHealth() {
        try {
            const [dbStatus, redisStatus, integrationStatus,] = await Promise.all([
                // Verifica conexão com banco
                this.checkDatabaseHealth(),
                // Verifica conexão com Redis
                this.checkRedisHealth(),
                // Verifica integrações
                this.checkIntegrationsHealth(),
            ]);
            return {
                status: 'UP',
                timestamp: new Date(),
                services: {
                    database: dbStatus,
                    redis: redisStatus,
                    integrations: integrationStatus,
                },
            };
        }
        catch (error) {
            this.logger.error('Erro ao verificar saúde do sistema', error.stack, 'MetricsService');
            return {
                status: 'DOWN',
                timestamp: new Date(),
                error: error.message,
            };
        }
    }
    async checkDatabaseHealth() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { status: 'UP' };
        }
        catch (error) {
            return {
                status: 'DOWN',
                error: error.message,
            };
        }
    }
    async checkRedisHealth() {
        try {
            const redis = await this.prisma.$queryRaw `SELECT * FROM pg_stat_activity WHERE application_name LIKE '%redis%'`;
            return {
                status: redis.length > 0 ? 'UP' : 'DOWN',
            };
        }
        catch (error) {
            return {
                status: 'DOWN',
                error: error.message,
            };
        }
    }
    async checkIntegrationsHealth() {
        const integrations = await this.prisma.integrationConfig.findMany({
            where: { ativo: true },
            select: {
                id: true,
                nome: true,
                tipo: true,
                consignanteId: true,
            },
        });
        const status = await Promise.all(integrations.map(async (integration) => {
            const lastLog = await this.prisma.integrationLog.findFirst({
                where: {
                    integrationId: integration.id,
                },
                orderBy: {
                    timestamp: 'desc',
                },
            });
            return {
                id: integration.id,
                nome: integration.nome,
                tipo: integration.tipo,
                status: lastLog?.success ? 'UP' : 'DOWN',
                lastCheck: lastLog?.timestamp,
            };
        }));
        return {
            total: integrations.length,
            healthy: status.filter(s => s.status === 'UP').length,
            services: status,
        };
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], MetricsService);
