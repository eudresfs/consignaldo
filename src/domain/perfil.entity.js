"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Perfil = void 0;
/**
 * Classe que encapsula os dados de um Perfil.
 */
class Perfil {
    constructor(id, nome, descricao, ativo, createdAt, updatedAt) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.Perfil = Perfil;
