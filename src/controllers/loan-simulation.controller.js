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
exports.LoanSimulationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const loan_simulation_service_1 = require("../services/implementations/loan-simulation.service");
class SimulateNewLoanDto {
}
class SimulateRefinanceDto {
}
class SimulatePortabilityDto {
}
let LoanSimulationController = class LoanSimulationController {
    constructor(simulationService) {
        this.simulationService = simulationService;
    }
    async simulateNewLoan(dto) {
        return this.simulationService.simulateNewLoan(dto.servidorId, dto.consignatariaId, dto.valorSolicitado, dto.prazo);
    }
    async simulateRefinance(dto) {
        return this.simulationService.simulateRefinance(dto.contratoId, dto.valorSolicitado, dto.prazo);
    }
    async simulatePortability(dto) {
        return this.simulationService.simulatePortability(dto.contratoOrigemId, dto.bancoOrigemId, dto.prazo);
    }
};
exports.LoanSimulationController = LoanSimulationController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Simular novo empréstimo' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Simulação realizada com sucesso',
        type: loan_simulation_interface_1.LoanSimulation,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Margem insuficiente ou prazo inválido',
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SimulateNewLoanDto]),
    __metadata("design:returntype", Promise)
], LoanSimulationController.prototype, "simulateNewLoan", null);
__decorate([
    (0, common_1.Post)('refinance'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Simular refinanciamento' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Simulação de refinanciamento realizada com sucesso',
        type: loan_simulation_interface_1.RefinanceSimulation,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Contrato inválido ou margem insuficiente',
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SimulateRefinanceDto]),
    __metadata("design:returntype", Promise)
], LoanSimulationController.prototype, "simulateRefinance", null);
__decorate([
    (0, common_1.Post)('portability'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Simular portabilidade' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Simulação de portabilidade realizada com sucesso',
        type: loan_simulation_interface_1.PortabilitySimulation,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Contrato inválido ou margem insuficiente',
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SimulatePortabilityDto]),
    __metadata("design:returntype", Promise)
], LoanSimulationController.prototype, "simulatePortability", null);
exports.LoanSimulationController = LoanSimulationController = __decorate([
    (0, swagger_1.ApiTags)('Simulação de Empréstimo'),
    (0, common_1.Controller)('loan-simulation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [loan_simulation_service_1.LoanSimulationService])
], LoanSimulationController);
