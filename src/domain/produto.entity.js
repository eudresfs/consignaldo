"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Produto = void 0;
/**
 * Classe que encapsula os dados de um Produto.
 */
class Produto {
    constructor(id, nome, descricao, preco, ativo, createdAt, updatedAt) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.preco = preco;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.Produto = Produto;
