"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permissao = void 0;
const base_entity_1 = require("./base.entity");
class Permissao extends base_entity_1.BaseEntity {
    constructor(id, nome, ativo = true, descricao = '') {
        super();
        this.id = id;
        this.nome = nome;
        this.ativo = ativo;
        this.descricao = descricao;
    }
}
exports.Permissao = Permissao;
