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
exports.BankIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bank_integration_service_1 = require("../services/bank-integration.service");
const auth_guard_1 = require("../infrastructure/auth/auth.guard");
const roles_guard_1 = require("../infrastructure/auth/roles.guard");
const roles_decorator_1 = require("../infrastructure/auth/roles.decorator");
let BankIntegrationController = class BankIntegrationController {
    constructor(bankIntegrationService) {
        this.bankIntegrationService = bankIntegrationService;
    }
    async importProposals(bankId) {
        return this.bankIntegrationService.importProposals(bankId);
    }
    async exportContract(contractId, bankId) {
        await this.bankIntegrationService.exportContract(contractId, bankId);
        return { message: 'Contrato exportado com sucesso' };
    }
    async handleWebhook(bankId, payload) {
        await this.bankIntegrationService.handleWebhook(payload, bankId);
        return { message: 'Webhook processado com sucesso' };
    }
};
exports.BankIntegrationController = BankIntegrationController;
__decorate([
    (0, common_1.Post)('import/:bankId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SYSTEM'),
    (0, swagger_1.ApiOperation)({ summary: 'Importa propostas do banco' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Propostas importadas com sucesso' }),
    __param(0, (0, common_1.Param)('bankId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], BankIntegrationController.prototype, "importProposals", null);
__decorate([
    (0, common_1.Post)('export/:contractId/:bankId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SYSTEM'),
    (0, swagger_1.ApiOperation)({ summary: 'Exporta contrato para o banco' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Contrato exportado com sucesso' }),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('bankId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], BankIntegrationController.prototype, "exportContract", null);
__decorate([
    (0, common_1.Post)('webhook/:bankId'),
    (0, swagger_1.ApiOperation)({ summary: 'Recebe webhook do banco' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Webhook processado com sucesso' }),
    __param(0, (0, common_1.Param)('bankId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], BankIntegrationController.prototype, "handleWebhook", null);
exports.BankIntegrationController = BankIntegrationController = __decorate([
    (0, swagger_1.ApiTags)('Integração com Bancos'),
    (0, common_1.Controller)('bank-integration'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [bank_integration_service_1.BankIntegrationService])
], BankIntegrationController);
