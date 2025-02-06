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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../infrastructure/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../infrastructure/security/guards/roles.guard");
const roles_decorator_1 = require("../infrastructure/security/decorators/roles.decorator");
const role_enum_1 = require("../domain/enums/role.enum");
const queue_service_1 = require("../infrastructure/queue/queue.service");
const metrics_service_1 = require("../services/metrics.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
let MonitoringController = class MonitoringController {
    constructor(queueService, metricsService, logger) {
        this.queueService = queueService;
        this.metricsService = metricsService;
        this.logger = logger;
    }
    async getQueuesStatus() {
        const [folhaStats, averbacaoStats] = await Promise.all([
            this.queueService.getQueueStats('folha-pagamento'),
            this.queueService.getQueueStats('averbacao'),
        ]);
        return {
            folhaPagamento: folhaStats,
            averbacao: averbacaoStats,
        };
    }
    async getFailedJobs(limit = 10, queue) {
        return this.queueService.getFailedJobs(queue, limit);
    }
    async getIntegrationMetrics(consignanteId, days = 7) {
        return this.metricsService.getIntegrationMetrics(consignanteId, days);
    }
    async getPerformanceMetrics(days = 7) {
        return this.metricsService.getPerformanceMetrics(days);
    }
    async getHealthStatus() {
        return this.metricsService.getSystemHealth();
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Get)('queues/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Status das filas de processamento' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getQueuesStatus", null);
__decorate([
    (0, common_1.Get)('jobs/failed'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista jobs com falha' }),
    __param(0, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('queue')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getFailedJobs", null);
__decorate([
    (0, common_1.Get)('metrics/integration'),
    (0, swagger_1.ApiOperation)({ summary: 'Métricas de integrações' }),
    __param(0, (0, common_1.Query)('consignanteId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('days', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getIntegrationMetrics", null);
__decorate([
    (0, common_1.Get)('metrics/performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Métricas de performance' }),
    __param(0, (0, common_1.Query)('days', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getPerformanceMetrics", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Status geral do sistema' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getHealthStatus", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, swagger_1.ApiTags)('Monitoramento'),
    (0, common_1.Controller)('monitoring'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        metrics_service_1.MetricsService,
        logger_service_1.LoggerService])
], MonitoringController);
