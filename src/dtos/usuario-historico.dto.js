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
exports.UpdateUsuarioHistoricoDto = exports.CreateUsuarioHistoricoDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateUsuarioHistoricoDto {
}
exports.CreateUsuarioHistoricoDto = CreateUsuarioHistoricoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do usuário' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateUsuarioHistoricoDto.prototype, "usuarioId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dados do usuário serializados' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioHistoricoDto.prototype, "usuarioSerializado", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data da modificação' }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreateUsuarioHistoricoDto.prototype, "modifiedOn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do usuário que fez a modificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateUsuarioHistoricoDto.prototype, "modifiedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nome do usuário que fez a modificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioHistoricoDto.prototype, "modifiedByName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo do usuário que fez a modificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioHistoricoDto.prototype, "modifiedByType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status de ativação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUsuarioHistoricoDto.prototype, "ativo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ação realizada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUsuarioHistoricoDto.prototype, "acao", void 0);
class UpdateUsuarioHistoricoDto {
}
exports.UpdateUsuarioHistoricoDto = UpdateUsuarioHistoricoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dados do usuário serializados' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUsuarioHistoricoDto.prototype, "usuarioSerializado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Data da modificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], UpdateUsuarioHistoricoDto.prototype, "modifiedOn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do usuário que fez a modificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateUsuarioHistoricoDto.prototype, "modifiedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nome do usuário que fez a modificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUsuarioHistoricoDto.prototype, "modifiedByName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo do usuário que fez a modificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUsuarioHistoricoDto.prototype, "modifiedByType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status de ativação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUsuarioHistoricoDto.prototype, "ativo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ação realizada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUsuarioHistoricoDto.prototype, "acao", void 0);
