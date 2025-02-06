"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Funcionario = void 0;
const base_entity_1 = require("./base.entity");
class Funcionario extends base_entity_1.BaseEntity {
    constructor(id, nome, cpf, dataAdmissao, ativo = true, email = '', cargo = '') {
        super();
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.dataAdmissao = dataAdmissao;
        this.ativo = ativo;
        this.email = email;
        this.cargo = cargo;
    }
}
exports.Funcionario = Funcionario;
