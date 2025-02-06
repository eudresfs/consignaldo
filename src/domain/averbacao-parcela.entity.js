"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoParcela = void 0;
/**
 * Classe que encapsula os dados de uma Parcela
 */
class AverbacaoParcela {
    constructor(id, averbacaoId, valor, vencimento, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.averbacaoId = averbacaoId;
        this.valor = valor;
        this.vencimento = vencimento;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoParcela = AverbacaoParcela;
