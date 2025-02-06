"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// Arquivo de configuração da aplicação
exports.config = {
    api: {
        prefix: '/api' // Prefixo base para as rotas da API
    },
    auth: {
        secret: process.env.JWT_SECRET || 'secrettoken' // Chave para assinatura dos tokens JWT
    }
};
