"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoImportacao = void 0;
/**
 * Classe que encapsula os dados da Importação de Averbação
 */
class AverbacaoImportacao {
    constructor(id, caminhoArquivo, status, ativo = true, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.caminhoArquivo = caminhoArquivo;
        this.status = status;
        this.ativo = ativo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.AverbacaoImportacao = AverbacaoImportacao;
