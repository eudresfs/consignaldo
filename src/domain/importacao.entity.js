"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Importacao = void 0;
const base_entity_1 = require("./base.entity");
class Importacao extends base_entity_1.BaseEntity {
    constructor(id, caminhoArquivo, status, dataImportacao, ativo = true, mensagem = '') {
        super();
        this.id = id;
        this.caminhoArquivo = caminhoArquivo;
        this.status = status;
        this.dataImportacao = dataImportacao;
        this.ativo = ativo;
        this.mensagem = mensagem;
    }
}
exports.Importacao = Importacao;
