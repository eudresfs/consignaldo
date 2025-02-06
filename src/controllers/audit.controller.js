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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("../services/audit.service");
const auth_guard_1 = require("../infrastructure/auth/auth.guard");
const roles_guard_1 = require("../infrastructure/auth/roles.guard");
const roles_decorator_1 = require("../infrastructure/auth/roles.decorator");
const rate_limit_decorator_1 = require("../infrastructure/rate-limit/rate-limit.decorator");
const audit_action_enum_1 = require("../domain/enums/audit-action.enum");
const audit_resource_enum_1 = require("../domain/enums/audit-resource.enum");
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async search(startDate, endDate, action, resource, resourceId, userId, username, consignanteId, status) {
        const filter = {
            startDate,
            endDate,
            action,
            resource,
            resourceId,
            userId,
            username,
            consignanteId,
            status,
        };
        return this.auditService.search(filter);
    }
    async getStats(startDate, endDate) {
        return this.auditService.getStats(startDate, endDate);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'AUDITOR'),
    (0, rate_limit_decorator_1.RateLimit)({ points: 50, duration: 60 }),
    (0, swagger_1.ApiOperation)({ summary: 'Busca eventos de auditoria' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [audit_interface_1.AuditEvent] }),
    __param(0, (0, common_1.Query)('startDate', common_1.ParseDatePipe)),
    __param(1, (0, common_1.Query)('endDate', common_1.ParseDatePipe)),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('resource')),
    __param(4, (0, common_1.Query)('resourceId')),
    __param(5, (0, common_1.Query)('userId')),
    __param(6, (0, common_1.Query)('username')),
    __param(7, (0, common_1.Query)('consignanteId')),
    __param(8, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String, String, String, Number, String, Number, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)('ADMIN', 'AUDITOR'),
    (0, rate_limit_decorator_1.RateLimit)({ points: 10, duration: 60 }),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém estatísticas de auditoria' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: audit_interface_1.AuditStats }),
    __param(0, (0, common_1.Query)('startDate', common_1.ParseDatePipe)),
    __param(1, (0, common_1.Query)('endDate', common_1.ParseDatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getStats", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('Auditoria'),
    (0, common_1.Controller)('audit'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
