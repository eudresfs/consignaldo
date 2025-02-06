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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const payroll_service_1 = require("../services/payroll.service");
const auth_guard_1 = require("../infrastructure/auth/auth.guard");
const roles_guard_1 = require("../infrastructure/auth/roles.guard");
const roles_decorator_1 = require("../infrastructure/auth/roles.decorator");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async importPayroll(consignanteId, file, competencia) {
        return this.payrollService.importPayroll(consignanteId, file, competencia);
    }
    async getImportStatus(id) {
        return this.payrollService.getImportStatus(id);
    }
    async reconcilePayroll(id) {
        return this.payrollService.reconcilePayroll(id);
    }
    async getReconciliationResult(id) {
        return this.payrollService.getReconciliationResult(id);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Post)('import/:consignanteId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Importa arquivo de folha de pagamento' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: payroll_interface_1.PayrollImport }),
    __param(0, (0, common_1.Param)('consignanteId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('competencia')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "importPayroll", null);
__decorate([
    (0, common_1.Get)('import/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca status da importação' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: payroll_interface_1.PayrollImport }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getImportStatus", null);
__decorate([
    (0, common_1.Post)('import/:id/reconcile'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Inicia reconciliação da folha' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [payroll_interface_1.PayrollReconciliation] }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "reconcilePayroll", null);
__decorate([
    (0, common_1.Get)('import/:id/reconciliation'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GESTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca resultado da reconciliação' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [payroll_interface_1.PayrollReconciliation] }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getReconciliationResult", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('Folha de Pagamento'),
    (0, common_1.Controller)('payroll'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
