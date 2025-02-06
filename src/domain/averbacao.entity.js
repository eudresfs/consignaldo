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
exports.Averbacao = exports.AverbacaoStatus = void 0;
const base_entity_1 = require("./base.entity");
const class_validator_1 = require("class-validator");
// Mover o enum para antes do uso dos decoradores
var AverbacaoStatus;
(function (AverbacaoStatus) {
    AverbacaoStatus["AGUARDANDO_APROVACAO"] = "AGUARDANDO_APROVACAO";
    AverbacaoStatus["APROVADO"] = "APROVADO";
    AverbacaoStatus["REJEITADO"] = "REJEITADO";
    AverbacaoStatus["CANCELADO"] = "CANCELADO";
})(AverbacaoStatus || (exports.AverbacaoStatus = AverbacaoStatus = {}));
/**
 * Classe que encapsula os dados de uma Averbação.
 */
class Averbacao extends base_entity_1.BaseEntity {
    constructor(id, dataAverbacao, status, valorTotal, ativo = true) {
        super();
        this.id = id;
        this.dataAverbacao = dataAverbacao;
        this.status = status;
        this.valorTotal = valorTotal;
        this.ativo = ativo;
    }
}
exports.Averbacao = Averbacao;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Averbacao.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], Averbacao.prototype, "dataAverbacao", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AverbacaoStatus),
    __metadata("design:type", String)
], Averbacao.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Averbacao.prototype, "valorTotal", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], Averbacao.prototype, "ativo", void 0);
