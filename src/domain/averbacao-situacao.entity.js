"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoSituacao = void 0;
/**
 * Classe que encapsula os dados de uma Situação de Averbação
 */
class AverbacaoSituacao {
    constructor(id, descricao, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.descricao = descricao;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoSituacao = AverbacaoSituacao;
