"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fluxo = void 0;
const base_entity_1 = require("./base.entity");
class Fluxo extends base_entity_1.BaseEntity {
    constructor(id, descricao, tipo, ativo = true) {
        super();
        this.id = id;
        this.descricao = descricao;
        this.tipo = tipo;
        this.ativo = ativo;
    }
}
exports.Fluxo = Fluxo;
