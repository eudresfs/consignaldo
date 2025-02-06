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
const request = __importStar(require("supertest"));
const app_module_1 = require("../../../app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
describe('API (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        // Configuração global
        app.useGlobalPipes(new common_1.ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }));
        // Swagger
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Consignaldo API')
            .setDescription('API do sistema de consignações')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api', app, document);
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Documentação', () => {
        it('deve retornar documentação Swagger', () => {
            return request(app.getHttpServer())
                .get('/api-json')
                .expect(200)
                .expect(res => {
                expect(res.body.info.title).toBe('Consignaldo API');
            });
        });
    });
    describe('Autenticação', () => {
        it('deve rejeitar requisição sem token', () => {
            return request(app.getHttpServer())
                .get('/servidor')
                .expect(401);
        });
        it('deve aceitar requisição com token válido', async () => {
            // Login
            const auth = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                username: 'admin',
                password: 'admin123',
            })
                .expect(201);
            // Usar token
            return request(app.getHttpServer())
                .get('/servidor')
                .set('Authorization', `Bearer ${auth.body.token}`)
                .expect(200);
        });
    });
    describe('Validação', () => {
        it('deve validar campos obrigatórios', () => {
            return request(app.getHttpServer())
                .post('/loan-simulation')
                .send({})
                .expect(400)
                .expect(res => {
                expect(res.body.message).toContain('valor');
                expect(res.body.message).toContain('prazo');
            });
        });
        it('deve validar tipos de dados', () => {
            return request(app.getHttpServer())
                .post('/loan-simulation')
                .send({
                valor: 'abc',
                prazo: '24',
            })
                .expect(400)
                .expect(res => {
                expect(res.body.message).toContain('valor must be a number');
            });
        });
    });
    describe('Headers', () => {
        it('deve incluir headers de segurança', () => {
            return request(app.getHttpServer())
                .get('/')
                .expect(200)
                .expect(res => {
                expect(res.headers['x-frame-options']).toBe('DENY');
                expect(res.headers['x-xss-protection']).toBe('1; mode=block');
                expect(res.headers['x-content-type-options']).toBe('nosniff');
            });
        });
    });
    describe('Rate Limiting', () => {
        it('deve limitar requisições em excesso', async () => {
            const requests = Array(100).fill(0).map(() => request(app.getHttpServer()).get('/'));
            const responses = await Promise.all(requests);
            const tooManyRequests = responses.filter(r => r.status === 429);
            expect(tooManyRequests.length).toBeGreaterThan(0);
        });
    });
    describe('Logging', () => {
        it('deve logar erros com detalhes', async () => {
            const errorLogs = [];
            const originalError = console.error;
            console.error = (...args) => errorLogs.push(args);
            await request(app.getHttpServer())
                .get('/invalid-route')
                .expect(404);
            console.error = originalError;
            expect(errorLogs.length).toBeGreaterThan(0);
        });
    });
    describe('CORS', () => {
        it('deve permitir origens configuradas', () => {
            return request(app.getHttpServer())
                .options('/')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'GET')
                .expect(204)
                .expect('Access-Control-Allow-Origin', 'http://localhost:3000');
        });
        it('deve bloquear origens não permitidas', () => {
            return request(app.getHttpServer())
                .options('/')
                .set('Origin', 'http://evil.com')
                .set('Access-Control-Request-Method', 'GET')
                .expect(204)
                .expect(res => {
                expect(res.headers['access-control-allow-origin']).toBeUndefined();
            });
        });
    });
});
