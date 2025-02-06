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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbarContratoDto = exports.ConsultarMargemDto = exports.ImportarFolhaDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ImportarFolhaDto {
}
exports.ImportarFolhaDto = ImportarFolhaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Competência no formato YYYY-MM' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarFolhaDto.prototype, "competencia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'binary', description: 'Arquivo da folha de pagamento' }),
    __metadata("design:type", typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object)
], ImportarFolhaDto.prototype, "file", void 0);
class ConsultarMargemDto {
}
exports.ConsultarMargemDto = ConsultarMargemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Matrícula do servidor' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConsultarMargemDto.prototype, "matricula", void 0);
class AverbarContratoDto {
}
exports.AverbarContratoDto = AverbarContratoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Matrícula do servidor' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AverbarContratoDto.prototype, "matricula", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número do contrato' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AverbarContratoDto.prototype, "contrato", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor da parcela' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AverbarContratoDto.prototype, "parcela", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prazo em meses' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AverbarContratoDto.prototype, "prazo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de início do contrato' }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], AverbarContratoDto.prototype, "dataInicio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código do banco' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AverbarContratoDto.prototype, "banco", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Situação do contrato' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AverbarContratoDto.prototype, "situacao", void 0);
