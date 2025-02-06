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
exports.UpdateVinculoDto = exports.CreateVinculoDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateVinculoDto {
}
exports.CreateVinculoDto = CreateVinculoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da consignatária' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVinculoDto.prototype, "consignatariaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do consignante' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVinculoDto.prototype, "consignanteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status de ativação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateVinculoDto.prototype, "ativo", void 0);
class UpdateVinculoDto {
}
exports.UpdateVinculoDto = UpdateVinculoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID da consignatária' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateVinculoDto.prototype, "consignatariaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do consignante' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateVinculoDto.prototype, "consignanteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status de ativação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateVinculoDto.prototype, "ativo", void 0);
