"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auditoria = void 0;
const base_entity_1 = require("./base.entity");
class Auditoria extends base_entity_1.BaseEntity {
    constructor(id, data, descricao, usuarioId, ativo = true) {
        super();
        this.id = id;
        this.data = data;
        this.descricao = descricao;
        this.usuarioId = usuarioId;
        this.ativo = ativo;
    }
}
exports.Auditoria = Auditoria;
