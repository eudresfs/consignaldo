"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const metrics_service_1 = require("../../services/metrics.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../../infrastructure/logger/logger.service");
describe('MetricsService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                metrics_service_1.MetricsService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        integrationLog: {
                            count: jest.fn(),
                            aggregate: jest.fn(),
                            groupBy: jest.fn(),
                        },
                        folhaPagamento: {
                            count: jest.fn(),
                        },
                        contrato: {
                            count: jest.fn(),
                        },
                        jobLog: {
                            aggregate: jest.fn(),
                            groupBy: jest.fn(),
                        },
                        integrationConfig: {
                            findMany: jest.fn(),
                        },
                        $queryRaw: jest.fn(),
                    },
                },
                {
                    provide: logger_service_1.LoggerService,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(metrics_service_1.MetricsService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    describe('getIntegrationMetrics', () => {
        it('deve retornar métricas de integração', async () => {
            jest.spyOn(prisma.integrationLog, 'count').mockResolvedValue(100);
            jest.spyOn(prisma.integrationLog, 'aggregate').mockResolvedValueOnce({
                _avg: { success: 0.95 },
            });
            jest.spyOn(prisma.integrationLog, 'aggregate').mockResolvedValueOnce({
                _avg: { duration: 250 },
            });
            jest.spyOn(prisma.integrationLog, 'groupBy').mockResolvedValue([
                { errorCode: 'API_ERROR', _count: 3 },
                { errorCode: 'TIMEOUT', _count: 2 },
            ]);
            const result = await service.getIntegrationMetrics(1, 7);
            expect(result.metrics).toEqual({
                totalRequests: 100,
                successRate: 95,
                avgDuration: 250,
                errorsByType: {
                    API_ERROR: 3,
                    TIMEOUT: 2,
                },
            });
        });
    });
    describe('getPerformanceMetrics', () => {
        it('deve retornar métricas de performance', async () => {
            jest.spyOn(prisma.folhaPagamento, 'count').mockResolvedValue(50);
            jest.spyOn(prisma.contrato, 'count').mockResolvedValue(200);
            jest.spyOn(prisma.jobLog, 'aggregate').mockResolvedValue({
                _avg: { duration: 1500 },
            });
            jest.spyOn(prisma.jobLog, 'groupBy').mockResolvedValue([
                { status: 'completed', _count: 240 },
                { status: 'failed', _count: 10 },
            ]);
            const result = await service.getPerformanceMetrics(7);
            expect(result.metrics).toEqual({
                processedFolhas: 50,
                processedAverbacoes: 200,
                avgProcessingTime: 1500,
                queueStatus: {
                    completed: 240,
                    failed: 10,
                },
            });
        });
    });
    describe('getSystemHealth', () => {
        it('deve retornar status de saúde do sistema', async () => {
            jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ dummy: 1 }]);
            jest.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ pid: 123 }]);
            jest.spyOn(prisma.integrationConfig, 'findMany').mockResolvedValue([
                {
                    id: 1,
                    nome: 'Test Integration',
                    tipo: 'MARGEM',
                    consignanteId: 1,
                },
            ]);
            const result = await service.getSystemHealth();
            expect(result.status).toBe('UP');
            expect(result.services).toBeDefined();
            expect(result.services.database.status).toBe('UP');
            expect(result.services.redis.status).toBe('UP');
        });
        it('deve identificar serviços com falha', async () => {
            jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('DB Error'));
            const result = await service.getSystemHealth();
            expect(result.status).toBe('DOWN');
            expect(result.error).toBeDefined();
        });
    });
});
