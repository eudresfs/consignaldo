"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conciliacao = void 0;
const base_entity_1 = require("./base.entity");
class Conciliacao extends base_entity_1.BaseEntity {
    constructor(id, dataConciliacao, status, ativo = true, valor = 0, observacao = '') {
        super();
        this.id = id;
        this.dataConciliacao = dataConciliacao;
        this.status = status;
        this.ativo = ativo;
        this.valor = valor;
        this.observacao = observacao;
    }
}
exports.Conciliacao = Conciliacao;
