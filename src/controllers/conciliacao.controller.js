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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConciliacaoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const conciliacao_service_1 = require("../services/conciliacao.service");
let ConciliacaoController = class ConciliacaoController {
    constructor(conciliacaoService) {
        this.conciliacaoService = conciliacaoService;
    }
    async findAll() {
        return this.conciliacaoService.findAll();
    }
    async findById(id) {
        return this.conciliacaoService.findById(id);
    }
    async create(data) {
        return this.conciliacaoService.create(data);
    }
    async update(id, data) {
        return this.conciliacaoService.update(id, data);
    }
    async remove(id) {
        return this.conciliacaoService.delete(id);
    }
};
exports.ConciliacaoController = ConciliacaoController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna todas as conciliações' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConciliacaoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retorna uma conciliação por id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConciliacaoController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cria uma nova conciliação' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConciliacaoController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualiza uma conciliação existente' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ConciliacaoController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove uma conciliação' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConciliacaoController.prototype, "remove", null);
exports.ConciliacaoController = ConciliacaoController = __decorate([
    (0, swagger_1.ApiTags)('Conciliacao'),
    (0, common_1.Controller)('conciliacao'),
    __metadata("design:paramtypes", [typeof (_a = typeof conciliacao_service_1.ConciliacaoService !== "undefined" && conciliacao_service_1.ConciliacaoService) === "function" ? _a : Object])
], ConciliacaoController);
