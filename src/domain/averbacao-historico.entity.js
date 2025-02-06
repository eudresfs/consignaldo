"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoHistorico = void 0;
/**
 * Classe que encapsula os dados do Histórico de Averbação
 */
class AverbacaoHistorico {
    constructor(id, averbacaoId, descricao, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.averbacaoId = averbacaoId;
        this.descricao = descricao;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoHistorico = AverbacaoHistorico;
