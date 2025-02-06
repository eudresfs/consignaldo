"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoTramitacao = void 0;
/**
 * Classe que encapsula os dados de Tramitação de Averbação
 */
class AverbacaoTramitacao {
    constructor(id, averbacaoId, usuarioId, data, situacao, observacao, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.averbacaoId = averbacaoId;
        this.usuarioId = usuarioId;
        this.data = data;
        this.situacao = situacao;
        this.observacao = observacao;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoTramitacao = AverbacaoTramitacao;
