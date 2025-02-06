"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const audit_service_1 = require("../../services/audit.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../../infrastructure/logger/logger.service");
const queue_service_1 = require("../../infrastructure/queue/queue.service");
const audit_action_enum_1 = require("../../domain/enums/audit-action.enum");
const audit_resource_enum_1 = require("../../domain/enums/audit-resource.enum");
describe('AuditService', () => {
    let service;
    let prisma;
    let queue;
    const mockConfig = {
        enabled: true,
        resources: {
            [audit_resource_enum_1.AuditResource.CONTRATO]: {
                actions: [audit_action_enum_1.AuditAction.CREATE, audit_action_enum_1.AuditAction.UPDATE],
                trackChanges: true,
                maskFields: ['senha', 'token'],
            },
        },
        retention: {
            days: 90,
            maxSize: 1000,
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                audit_service_1.AuditService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        auditLog: {
                            create: jest.fn(),
                            findMany: jest.fn(),
                            count: jest.fn(),
                            groupBy: jest.fn(),
                            deleteMany: jest.fn(),
                        },
                    },
                },
                {
                    provide: logger_service_1.LoggerService,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: queue_service_1.QueueService,
                    useValue: {
                        add: jest.fn(),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(mockConfig),
                    },
                },
            ],
        }).compile();
        service = module.get(audit_service_1.AuditService);
        prisma = module.get(prisma_service_1.PrismaService);
        queue = module.get(queue_service_1.QueueService);
    });
    describe('log', () => {
        it('deve adicionar evento à fila quando configurado', async () => {
            const event = {
                action: audit_action_enum_1.AuditAction.CREATE,
                resource: audit_resource_enum_1.AuditResource.CONTRATO,
                userId: 1,
                username: 'teste',
                status: 'SUCCESS',
            };
            await service.log(event);
            expect(queue.add).toHaveBeenCalledWith('audit', expect.objectContaining({
                action: event.action,
                resource: event.resource,
            }), expect.any(Object));
        });
        it('não deve adicionar evento quando recurso não está configurado', async () => {
            const event = {
                action: audit_action_enum_1.AuditAction.CREATE,
                resource: audit_resource_enum_1.AuditResource.AUTH,
                userId: 1,
                username: 'teste',
                status: 'SUCCESS',
            };
            await service.log(event);
            expect(queue.add).not.toHaveBeenCalled();
        });
        it('deve mascarar campos sensíveis', async () => {
            const event = {
                action: audit_action_enum_1.AuditAction.CREATE,
                resource: audit_resource_enum_1.AuditResource.CONTRATO,
                userId: 1,
                username: 'teste',
                status: 'SUCCESS',
                newValue: {
                    nome: 'Teste',
                    senha: '123456',
                    token: 'abc123',
                },
            };
            await service.log(event);
            expect(queue.add).toHaveBeenCalledWith('audit', expect.objectContaining({
                newValue: {
                    nome: 'Teste',
                    senha: '***',
                    token: '***',
                },
            }), expect.any(Object));
        });
    });
    describe('search', () => {
        it('deve buscar eventos com filtros', async () => {
            const filter = {
                startDate: new Date(),
                action: audit_action_enum_1.AuditAction.CREATE,
                resource: audit_resource_enum_1.AuditResource.CONTRATO,
            };
            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
            await service.search(filter);
            expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    timestamp: {
                        gte: filter.startDate,
                    },
                    action: filter.action,
                    resource: filter.resource,
                }),
                orderBy: {
                    timestamp: 'desc',
                },
                take: 1000,
            });
        });
    });
    describe('getStats', () => {
        it('deve retornar estatísticas agregadas', async () => {
            const startDate = new Date();
            const endDate = new Date();
            jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(100);
            jest.spyOn(prisma.auditLog, 'groupBy')
                .mockResolvedValueOnce([
                { action: audit_action_enum_1.AuditAction.CREATE, _count: 50 },
                { action: audit_action_enum_1.AuditAction.UPDATE, _count: 50 },
            ])
                .mockResolvedValueOnce([
                { resource: audit_resource_enum_1.AuditResource.CONTRATO, _count: 100 },
            ])
                .mockResolvedValueOnce([
                { status: 'SUCCESS', _count: 90 },
                { status: 'ERROR', _count: 10 },
            ])
                .mockResolvedValueOnce([
                { userId: 1, username: 'teste', _count: 50 },
            ])
                .mockResolvedValueOnce([
                { error: 'Erro teste', _count: 5 },
            ]);
            const stats = await service.getStats(startDate, endDate);
            expect(stats).toEqual({
                totalEvents: 100,
                periodStart: startDate,
                periodEnd: endDate,
                byAction: {
                    [audit_action_enum_1.AuditAction.CREATE]: 50,
                    [audit_action_enum_1.AuditAction.UPDATE]: 50,
                },
                byResource: {
                    [audit_resource_enum_1.AuditResource.CONTRATO]: 100,
                },
                byStatus: {
                    success: 90,
                    error: 10,
                },
                topUsers: [
                    {
                        userId: 1,
                        username: 'teste',
                        count: 50,
                    },
                ],
                topErrors: [
                    {
                        error: 'Erro teste',
                        count: 5,
                    },
                ],
            });
        });
    });
    describe('cleanup', () => {
        it('deve limpar registros antigos', async () => {
            const mockDate = new Date();
            jest.useFakeTimers().setSystemTime(mockDate);
            await service.cleanup();
            const cutoffDate = new Date(mockDate);
            cutoffDate.setDate(cutoffDate.getDate() - mockConfig.retention.days);
            expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
                where: {
                    timestamp: {
                        lt: cutoffDate,
                    },
                },
            });
        });
    });
});
