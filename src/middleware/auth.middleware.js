"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
/**
 * Middleware de autenticação com JWT.
 * Verifica se o cabeçalho Authorization possui um token válido.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido." });
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
        return res.status(401).json({ error: "Token mal formatado." });
    }
    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: "Token mal formatado." });
    }
    jsonwebtoken_1.default.verify(token, config_1.config.auth.secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido." });
        }
        // Se necessário, você pode anexar as informações do token à requisição:
        // (ex: req.user = decoded)
        next();
    });
}
