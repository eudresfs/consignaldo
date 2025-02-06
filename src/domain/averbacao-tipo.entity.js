"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoTipo = void 0;
/**
 * Classe que encapsula os dados de um Tipo de Averbação
 */
class AverbacaoTipo {
    constructor(id, descricao, sigla, prazo, valorMinimo, valorMaximo, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.descricao = descricao;
        this.sigla = sigla;
        this.prazo = prazo;
        this.valorMinimo = valorMinimo;
        this.valorMaximo = valorMaximo;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoTipo = AverbacaoTipo;
