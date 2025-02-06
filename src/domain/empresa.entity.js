"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Empresa = void 0;
const base_entity_1 = require("./base.entity");
class Empresa extends base_entity_1.BaseEntity {
    constructor(id, nome, cnpj, ativo = true, endereco = '', telefone = '') {
        super();
        this.id = id;
        this.nome = nome;
        this.cnpj = cnpj;
        this.ativo = ativo;
        this.endereco = endereco;
        this.telefone = telefone;
    }
}
exports.Empresa = Empresa;
