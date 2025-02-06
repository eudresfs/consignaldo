"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoVinculo = void 0;
/**
 * Classe que encapsula os dados do Vínculo de Averbação
 */
class AverbacaoVinculo {
    constructor(id, averbacaoId, averbacaoPaiId, tipo, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.averbacaoId = averbacaoId;
        this.averbacaoPaiId = averbacaoPaiId;
        this.tipo = tipo;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoVinculo = AverbacaoVinculo;
