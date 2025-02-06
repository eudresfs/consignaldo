"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoParcelaSituacao = void 0;
/**
 * Classe que encapsula os dados da Situação de Parcela
 */
class AverbacaoParcelaSituacao {
    constructor(id, parcelaId, situacao, data, observacao, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.parcelaId = parcelaId;
        this.situacao = situacao;
        this.data = data;
        this.observacao = observacao;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoParcelaSituacao = AverbacaoParcelaSituacao;
