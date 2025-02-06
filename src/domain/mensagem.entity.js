"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mensagem = void 0;
const base_entity_1 = require("./base.entity");
class Mensagem extends base_entity_1.BaseEntity {
    constructor(id, titulo, conteudo, dataEnvio, ativo = true, remetente = '', destinatario = '') {
        super();
        this.id = id;
        this.titulo = titulo;
        this.conteudo = conteudo;
        this.dataEnvio = dataEnvio;
        this.ativo = ativo;
        this.remetente = remetente;
        this.destinatario = destinatario;
    }
}
exports.Mensagem = Mensagem;
