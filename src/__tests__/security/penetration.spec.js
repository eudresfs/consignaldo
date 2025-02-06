"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../../app.module");
const request = __importStar(require("supertest"));
const jwt = __importStar(require("jsonwebtoken"));
const security_service_1 = require("../../services/security.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
describe('Testes de Segurança Avançados', () => {
    let app;
    let securityService;
    let prisma;
    beforeAll(async () => {
        app = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        securityService = app.get(security_service_1.SecurityService);
        prisma = app.get(prisma_service_1.PrismaService);
    });
    describe('Proteção contra Injeção', () => {
        it('deve prevenir NoSQL Injection', async () => {
            const maliciousQuery = {
                email: { $ne: null },
                password: { $ne: null },
            };
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(maliciousQuery)
                .expect(400);
            expect(response.body.message).toContain('Invalid input');
        });
        it('deve prevenir Command Injection', async () => {
            const maliciousCommand = 'file.txt; rm -rf /';
            const response = await request(app.getHttpServer())
                .post('/files/process')
                .send({ filename: maliciousCommand })
                .expect(400);
            expect(response.body.message).toContain('Invalid filename');
        });
        it('deve prevenir XSS persistente', async () => {
            const xssPayload = {
                nome: '<script>alert("xss")</script>',
                cpf: '12345678900',
            };
            const response = await request(app.getHttpServer())
                .post('/servidor')
                .send(xssPayload)
                .expect(201);
            expect(response.body.nome).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
        });
    });
    describe('Proteção contra Ataques de Autenticação', () => {
        it('deve bloquear força bruta', async () => {
            const attempts = [];
            for (let i = 0; i < 10; i++) {
                attempts.push(request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                    email: 'user@test.com',
                    password: `wrong${i}`,
                }));
            }
            const responses = await Promise.all(attempts);
            const blocked = responses.filter(r => r.status === 429);
            expect(blocked.length).toBeGreaterThan(0);
        });
        it('deve validar complexidade de senha', async () => {
            const weakPasswords = [
                '123456',
                'password',
                'qwerty',
                'abc123',
            ];
            for (const password of weakPasswords) {
                const response = await request(app.getHttpServer())
                    .post('/auth/register')
                    .send({
                    email: 'test@test.com',
                    password,
                })
                    .expect(400);
                expect(response.body.message).toContain('weak password');
            }
        });
        it('deve exigir MFA para ações sensíveis', async () => {
            const token = jwt.sign({ userId: 1 }, 'secret');
            const response = await request(app.getHttpServer())
                .post('/contract/approve')
                .set('Authorization', `Bearer ${token}`)
                .send({ contractId: 1 })
                .expect(403);
            expect(response.body.message).toContain('MFA required');
        });
    });
    describe('Proteção contra Vazamento de Informações', () => {
        it('deve mascarar dados sensíveis em logs', async () => {
            const spy = jest.spyOn(console, 'log');
            await request(app.getHttpServer())
                .post('/servidor')
                .send({
                nome: 'Test',
                cpf: '12345678900',
                cartao: '4111111111111111',
            });
            const logs = spy.mock.calls.flat();
            expect(logs.join(' ')).not.toContain('12345678900');
            expect(logs.join(' ')).not.toContain('4111111111111111');
            spy.mockRestore();
        });
        it('deve prevenir directory traversal', async () => {
            const paths = [
                '../config/secret.key',
                '..\\windows\\system32',
                '/etc/passwd',
                '%2e%2e%2fconfig',
            ];
            for (const path of paths) {
                const response = await request(app.getHttpServer())
                    .get(`/files/${path}`)
                    .expect(400);
                expect(response.body.message).toContain('Invalid path');
            }
        });
    });
    describe('Proteção contra Ataques de Sessão', () => {
        it('deve invalidar todas as sessões ao trocar senha', async () => {
            // Cria múltiplas sessões
            const sessions = [];
            for (let i = 0; i < 3; i++) {
                const response = await request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                    email: 'user@test.com',
                    password: 'correct-password',
                });
                sessions.push(response.body.token);
            }
            // Troca senha
            await request(app.getHttpServer())
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${sessions[0]}`)
                .send({
                oldPassword: 'correct-password',
                newPassword: 'new-strong-password123!',
            });
            // Verifica se todas as sessões foram invalidadas
            for (const token of sessions) {
                await request(app.getHttpServer())
                    .get('/protected-route')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(401);
            }
        });
        it('deve implementar CSRF token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'user@test.com',
                password: 'password123',
            });
            expect(response.headers['x-csrf-token']).toBeDefined();
            // Tenta request sem CSRF token
            await request(app.getHttpServer())
                .post('/contract/create')
                .set('Cookie', response.headers['set-cookie'])
                .expect(403);
        });
    });
    describe('Headers de Segurança', () => {
        it('deve incluir headers de segurança', async () => {
            const response = await request(app.getHttpServer())
                .get('/health')
                .expect(200);
            expect(response.headers).toMatchObject({
                'strict-transport-security': expect.any(String),
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'DENY',
                'x-xss-protection': '1; mode=block',
                'content-security-policy': expect.any(String),
            });
        });
        it('deve configurar cookies seguros', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'user@test.com',
                password: 'password123',
            });
            const cookie = response.headers['set-cookie'][0];
            expect(cookie).toContain('HttpOnly');
            expect(cookie).toContain('Secure');
            expect(cookie).toContain('SameSite=Strict');
        });
    });
});
