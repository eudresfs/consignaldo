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
exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const report_service_1 = require("../services/report.service");
const auth_guard_1 = require("../infrastructure/auth/auth.guard");
const roles_guard_1 = require("../infrastructure/auth/roles.guard");
const roles_decorator_1 = require("../infrastructure/auth/roles.decorator");
const rate_limit_decorator_1 = require("../infrastructure/rate-limit/rate-limit.decorator");
const report_type_enum_1 = require("../domain/enums/report-type.enum");
const report_format_enum_1 = require("../domain/enums/report-format.enum");
let ReportController = class ReportController {
    constructor(reportService) {
        this.reportService = reportService;
    }
    async generateReport(config, filters) {
        return this.reportService.generateReport(config, filters);
    }
    async listTemplates(tipo, formato) {
        return this.reportService.listTemplates(tipo, formato);
    }
    async createTemplate(template) {
        return this.reportService.createTemplate(template);
    }
    async updateTemplate(id, template) {
        return this.reportService.updateTemplate(id, template);
    }
    async deleteTemplate(id) {
        await this.reportService.deleteTemplate(id);
    }
    async scheduleReport(schedule) {
        return this.reportService.scheduleReport(schedule);
    }
    async listSchedules() {
        return this.reportService.listSchedules();
    }
    async deleteSchedule(id) {
        await this.reportService.deleteSchedule(id);
    }
    async getReport(id) {
        return this.reportService.getReport(id);
    }
    async downloadReport(id) {
        return this.reportService.downloadReport(id);
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, rate_limit_decorator_1.RateLimit)({ points: 10, duration: 60 }),
    (0, swagger_1.ApiOperation)({ summary: 'Gera um novo relatório' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: report_interface_1.ReportResult }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista templates disponíveis' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [report_interface_1.ReportTemplate] }),
    __param(0, (0, common_1.Query)('tipo')),
    __param(1, (0, common_1.Query)('formato')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria novo template' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: report_interface_1.ReportTemplate }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualiza template existente' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: report_interface_1.ReportTemplate }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove template' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Post)('schedule'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Agenda geração de relatório' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: report_interface_1.ReportSchedule }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "scheduleReport", null);
__decorate([
    (0, common_1.Get)('schedule'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista agendamentos' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [report_interface_1.ReportSchedule] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "listSchedules", null);
__decorate([
    (0, common_1.Delete)('schedule/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove agendamento' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "deleteSchedule", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR', 'USUARIO'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca relatório por ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: report_interface_1.ReportResult }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getReport", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR', 'USUARIO'),
    (0, swagger_1.ApiOperation)({ summary: 'Download do relatório' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "downloadReport", null);
exports.ReportController = ReportController = __decorate([
    (0, swagger_1.ApiTags)('Relatórios'),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [report_service_1.ReportService])
], ReportController);
