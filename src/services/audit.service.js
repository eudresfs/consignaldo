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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
const queue_service_1 = require("../infrastructure/queue/queue.service");
const uuid_1 = require("uuid");
let AuditService = class AuditService {
    constructor(prisma, logger, queue, configService) {
        this.prisma = prisma;
        this.logger = logger;
        this.queue = queue;
        this.config = configService.get('audit');
    }
    async log(event) {
        if (!this.config.enabled) {
            return;
        }
        try {
            const resourceConfig = this.config.resources[event.resource];
            if (!resourceConfig?.actions.includes(event.action)) {
                return;
            }
            const auditEvent = {
                ...event,
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
            };
            // Mascara campos sensíveis
            if (resourceConfig.maskFields?.length) {
                auditEvent.oldValue = this.maskSensitiveData(auditEvent.oldValue, resourceConfig.maskFields);
                auditEvent.newValue = this.maskSensitiveData(auditEvent.newValue, resourceConfig.maskFields);
            }
            // Adiciona à fila para processamento assíncrono
            await this.queue.add('audit', auditEvent, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            });
        }
        catch (error) {
            this.logger.error('Erro ao registrar evento de auditoria', error.stack, 'AuditService', { resource: event.resource, action: event.action });
        }
    }
    async search(filter) {
        const where = this.buildWhereClause(filter);
        return this.prisma.auditLog.findMany({
            where,
            orderBy: {
                timestamp: 'desc',
            },
            take: 1000, // Limite para não sobrecarregar
        });
    }
    async getStats(startDate, endDate = new Date()) {
        const [totalEvents, actionStats, resourceStats, statusStats, topUsers, topErrors,] = await Promise.all([
            // Total de eventos
            this.prisma.auditLog.count({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
            // Contagem por ação
            this.prisma.auditLog.groupBy({
                by: ['action'],
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _count: true,
            }),
            // Contagem por recurso
            this.prisma.auditLog.groupBy({
                by: ['resource'],
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _count: true,
            }),
            // Contagem por status
            this.prisma.auditLog.groupBy({
                by: ['status'],
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _count: true,
            }),
            // Top usuários
            this.prisma.auditLog.groupBy({
                by: ['userId', 'username'],
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                    userId: { not: null },
                },
                _count: true,
                orderBy: {
                    _count: {
                        userId: 'desc',
                    },
                },
                take: 10,
            }),
            // Top erros
            this.prisma.auditLog.groupBy({
                by: ['error'],
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'ERROR',
                    error: { not: null },
                },
                _count: true,
                orderBy: {
                    _count: {
                        error: 'desc',
                    },
                },
                take: 10,
            }),
        ]);
        return {
            totalEvents,
            periodStart: startDate,
            periodEnd: endDate,
            byAction: this.transformGroupStats(actionStats),
            byResource: this.transformGroupStats(resourceStats),
            byStatus: {
                success: statusStats.find(s => s.status === 'SUCCESS')?._count || 0,
                error: statusStats.find(s => s.status === 'ERROR')?._count || 0,
            },
            topUsers: topUsers.map(u => ({
                userId: u.userId,
                username: u.username,
                count: u._count,
            })),
            topErrors: topErrors.map(e => ({
                error: e.error,
                count: e._count,
            })),
        };
    }
    async cleanup() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retention.days);
        await this.prisma.auditLog.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });
    }
    buildWhereClause(filter) {
        const where = {};
        if (filter.startDate || filter.endDate) {
            where.timestamp = {};
            if (filter.startDate) {
                where.timestamp.gte = filter.startDate;
            }
            if (filter.endDate) {
                where.timestamp.lte = filter.endDate;
            }
        }
        if (filter.action) {
            where.action = filter.action;
        }
        if (filter.resource) {
            where.resource = filter.resource;
        }
        if (filter.resourceId) {
            where.resourceId = filter.resourceId;
        }
        if (filter.userId) {
            where.userId = filter.userId;
        }
        if (filter.username) {
            where.username = {
                contains: filter.username,
                mode: 'insensitive',
            };
        }
        if (filter.consignanteId) {
            where.consignanteId = filter.consignanteId;
        }
        if (filter.status) {
            where.status = filter.status;
        }
        return where;
    }
    transformGroupStats(stats) {
        return stats.reduce((acc, curr) => {
            const key = Object.keys(curr).find(k => k !== '_count');
            acc[curr[key]] = curr._count;
            return acc;
        }, {});
    }
    maskSensitiveData(data, fields) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        const masked = { ...data };
        for (const field of fields) {
            if (field in masked) {
                masked[field] = '***';
            }
        }
        return masked;
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        queue_service_1.QueueService,
        config_1.ConfigService])
], AuditService);
