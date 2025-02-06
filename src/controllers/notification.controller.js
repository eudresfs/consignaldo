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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notification_service_1 = require("../services/notification.service");
const auth_guard_1 = require("../infrastructure/auth/auth.guard");
const roles_guard_1 = require("../infrastructure/auth/roles.guard");
const roles_decorator_1 = require("../infrastructure/auth/roles.decorator");
const rate_limit_decorator_1 = require("../infrastructure/rate-limit/rate-limit.decorator");
const notification_type_enum_1 = require("../domain/enums/notification-type.enum");
const notification_event_enum_1 = require("../domain/enums/notification-event.enum");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async notify(data) {
        return this.notificationService.notify(data);
    }
    async listTemplates(tipo, evento) {
        return this.notificationService.getTemplates(tipo, evento);
    }
    async createTemplate(template) {
        return this.notificationService.createTemplate(template);
    }
    async updateTemplate(id, template) {
        return this.notificationService.updateTemplate(id, template);
    }
    async deleteTemplate(id) {
        await this.notificationService.deleteTemplate(id);
    }
    async listConfigs(tipo, evento) {
        return this.notificationService.getConfigs(tipo, evento);
    }
    async createConfig(config) {
        return this.notificationService.createConfig(config);
    }
    async updateConfig(id, config) {
        return this.notificationService.updateConfig(id, config);
    }
    async deleteConfig(id) {
        await this.notificationService.deleteConfig(id);
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR', 'SISTEMA'),
    (0, rate_limit_decorator_1.RateLimit)({ points: 100, duration: 60 }),
    (0, swagger_1.ApiOperation)({ summary: 'Envia uma notificação' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: [notification_interface_1.NotificationResult] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "notify", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista templates disponíveis' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [notification_interface_1.NotificationTemplate] }),
    __param(0, (0, common_1.Query)('tipo')),
    __param(1, (0, common_1.Query)('evento')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria novo template' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: notification_interface_1.NotificationTemplate }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualiza template existente' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: notification_interface_1.NotificationTemplate }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove template' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('configs'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista configurações' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [notification_interface_1.NotificationConfig] }),
    __param(0, (0, common_1.Query)('tipo')),
    __param(1, (0, common_1.Query)('evento')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "listConfigs", null);
__decorate([
    (0, common_1.Post)('configs'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria nova configuração' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: notification_interface_1.NotificationConfig }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createConfig", null);
__decorate([
    (0, common_1.Put)('configs/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualiza configuração existente' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: notification_interface_1.NotificationConfig }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Delete)('configs/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove configuração' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "deleteConfig", null);
exports.NotificationController = NotificationController = __decorate([
    (0, swagger_1.ApiTags)('Notificações'),
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
