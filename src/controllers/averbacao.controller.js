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
exports.AverbacaoController = void 0;
const averbacao_service_1 = require("../services/averbacao.service");
const error_handler_1 = require("../middleware/error.handler");
const averbacao_dto_1 = require("../dtos/averbacao.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@nestjs/common");
const common_3 = require("@nestjs/common");
/**
 * Controller para endpoints relacionados a Averbacão.
 */
class AverbacaoController {
    constructor() {
        /**
         * Endpoint para listar Averbacões.
         */
        this.listarAverbacoes = async (req, res) => {
            try {
                const averbacoes = await this.averbacaoService.listarAverbacoes();
                return res.json(averbacoes);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        this.averbacaoService = new averbacao_service_1.AverbacaoService();
    }
    /**
     * Endpoint para criar uma nova Averbacão.
     */
    async create(dto) {
        return this.averbacaoService.create(dto);
    }
    async findById(id) {
        const averbacao = await this.averbacaoService.findById(id);
        if (!averbacao) {
            throw new common_1.NotFoundException('Averbação não encontrada');
        }
        return averbacao;
    }
}
exports.AverbacaoController = AverbacaoController;
__decorate([
    (0, common_3.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cria uma nova averbação' }),
    (0, common_2.UsePipes)(new common_2.ValidationPipe()),
    __param(0, (0, common_3.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [averbacao_dto_1.CreateAverbacaoDto]),
    __metadata("design:returntype", Promise)
], AverbacaoController.prototype, "create", null);
__decorate([
    (0, common_3.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna uma averbação por id' }),
    __param(0, (0, common_3.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AverbacaoController.prototype, "findById", null);
