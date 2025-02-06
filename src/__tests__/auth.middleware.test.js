"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const config_1 = require("../config");
// Configurando uma rota protegida para os testes
const app = (0, express_1.default)();
app.get('/protected', auth_middleware_1.authMiddleware, (req, res) => {
    res.json({ success: true });
});
describe('Auth Middleware', () => {
    it('deve retornar 401 se o token não for fornecido', async () => {
        const res = await (0, supertest_1.default)(app).get('/protected');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Token não fornecido.');
    });
    it('deve retornar 401 se o token estiver mal formatado', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/protected')
            .set('Authorization', 'Bearer');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Token mal formatado.');
    });
    it('deve retornar 401 para token inválido', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Token inválido.');
    });
    it('deve permitir o acesso com um token válido', async () => {
        const token = jsonwebtoken_1.default.sign({ userId: 1 }, config_1.config.auth.secret, { expiresIn: '1h' });
        const res = await (0, supertest_1.default)(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });
});
