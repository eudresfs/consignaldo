"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
/**
 * Classe que encapsula os dados de um Usuário.
 */
class Usuario {
    constructor(id, pessoaId, login, senha, situacao, ultimoAcesso, ativo, criadoEm, atualizadoEm) {
        this.id = id;
        this.pessoaId = pessoaId;
        this.login = login;
        this.senha = senha;
        this.situacao = situacao;
        this.ultimoAcesso = ultimoAcesso;
        this.ativo = ativo;
        this.criadoEm = criadoEm;
        this.atualizadoEm = atualizadoEm;
    }
}
exports.Usuario = Usuario;
