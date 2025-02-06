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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAverbacaoDto = void 0;
const class_validator_1 = require("class-validator");
const averbacao_entity_1 = require("../domain/averbacao.entity");
class CreateAverbacaoDto {
    constructor() {
        this.ativo = true;
    }
}
exports.CreateAverbacaoDto = CreateAverbacaoDto;
__decorate([
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreateAverbacaoDto.prototype, "dataAverbacao", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(averbacao_entity_1.AverbacaoStatus),
    __metadata("design:type", String)
], CreateAverbacaoDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAverbacaoDto.prototype, "valorTotal", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAverbacaoDto.prototype, "ativo", void 0);
