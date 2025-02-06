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
exports.IntegrationController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../infrastructure/security/guards/jwt-auth.guard");
const roles_guard_1 = require("../infrastructure/security/guards/roles.guard");
const roles_decorator_1 = require("../infrastructure/security/decorators/roles.decorator");
const role_enum_1 = require("../domain/enums/role.enum");
const integration_service_1 = require("../services/integration.service");
const integration_dto_1 = require("../dtos/integration.dto");
const logger_service_1 = require("../infrastructure/logger/logger.service");
let IntegrationController = class IntegrationController {
    constructor(integrationService, logger) {
        this.integrationService = integrationService;
        this.logger = logger;
    }
    async importarFolha(consignanteId, dto, file) {
        this.logger.log('Iniciando importação de folha', 'IntegrationController', { consignanteId, competencia: dto.competencia });
        const result = await this.integrationService.importarFolhaPagamento(consignanteId, dto.competencia, file.buffer);
        if (!result.success) {
            this.logger.error('Erro na importação de folha', result.error?.message, 'IntegrationController', { consignanteId, competencia: dto.competencia });
        }
        return result;
    }
    async consultarMargem(consignanteId, matricula) {
        this.logger.log('Consultando margem', 'IntegrationController', { consignanteId, matricula });
        return this.integrationService.consultarMargem(consignanteId, matricula);
    }
    async averbarContrato(consignanteId, dto) {
        this.logger.log('Iniciando averbação', 'IntegrationController', { consignanteId, contrato: dto.contrato });
        return this.integrationService.averbarContrato(consignanteId, dto);
    }
};
exports.IntegrationController = IntegrationController;
__decorate([
    (0, common_1.Post)(':consignanteId/folha'),
    (0, swagger_1.ApiOperation)({ summary: 'Importa arquivo de folha de pagamento' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ type: integration_dto_1.ImportarFolhaDto }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.CONSIGNANTE),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('consignanteId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, integration_dto_1.ImportarFolhaDto, typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], IntegrationController.prototype, "importarFolha", null);
__decorate([
    (0, common_1.Get)(':consignanteId/margem/:matricula'),
    (0, swagger_1.ApiOperation)({ summary: 'Consulta margem consignável do servidor' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.CONSIGNATARIA, role_enum_1.Role.CONSIGNANTE),
    __param(0, (0, common_1.Param)('consignanteId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('matricula')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], IntegrationController.prototype, "consultarMargem", null);
__decorate([
    (0, common_1.Post)(':consignanteId/averbar'),
    (0, swagger_1.ApiOperation)({ summary: 'Realiza averbação de contrato' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.CONSIGNATARIA),
    __param(0, (0, common_1.Param)('consignanteId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, integration_dto_1.AverbarContratoDto]),
    __metadata("design:returntype", Promise)
], IntegrationController.prototype, "averbarContrato", null);
exports.IntegrationController = IntegrationController = __decorate([
    (0, swagger_1.ApiTags)('Integração'),
    (0, common_1.Controller)('integration'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        logger_service_1.LoggerService])
], IntegrationController);
