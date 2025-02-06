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
const perf_hooks_1 = require("perf_hooks");
const metrics_service_1 = require("../../infrastructure/observability/metrics.service");
describe('Testes de Performance', () => {
    let app;
    let metricsService;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        metricsService = app.get(metrics_service_1.MetricsService);
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Simulação de Empréstimo', () => {
        it('deve responder em menos de 100ms', async () => {
            const start = perf_hooks_1.performance.now();
            await request(app.getHttpServer())
                .post('/loan-simulation')
                .send({
                valor: 10000,
                prazo: 24,
                taxaJuros: 1.99,
            })
                .expect(201);
            const duration = perf_hooks_1.performance.now() - start;
            expect(duration).toBeLessThan(100);
        });
        it('deve manter performance com múltiplas requisições', async () => {
            const requests = Array(100).fill(0).map(() => request(app.getHttpServer())
                .post('/loan-simulation')
                .send({
                valor: 10000,
                prazo: 24,
                taxaJuros: 1.99,
            }));
            const start = perf_hooks_1.performance.now();
            await Promise.all(requests);
            const duration = perf_hooks_1.performance.now() - start;
            // Média de 50ms por requisição
            expect(duration / requests.length).toBeLessThan(50);
        });
    });
    describe('Importação de Folha', () => {
        it('deve processar arquivo grande em menos de 5s', async () => {
            const bigFile = Buffer.alloc(1024 * 1024 * 10); // 10MB
            const start = perf_hooks_1.performance.now();
            await request(app.getHttpServer())
                .post('/payroll/import')
                .attach('file', bigFile, 'folha.csv')
                .expect(201);
            const duration = perf_hooks_1.performance.now() - start;
            expect(duration).toBeLessThan(5000);
        });
        it('deve manter uso de memória estável', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            // Processa 10 arquivos de 1MB
            for (let i = 0; i < 10; i++) {
                const file = Buffer.alloc(1024 * 1024);
                await request(app.getHttpServer())
                    .post('/payroll/import')
                    .attach('file', file, 'folha.csv');
            }
            const finalMemory = process.memoryUsage().heapUsed;
            const diff = finalMemory - initialMemory;
            // Não deve aumentar mais que 50MB
            expect(diff).toBeLessThan(50 * 1024 * 1024);
        });
    });
    describe('Cache', () => {
        it('deve usar cache para consultas frequentes', async () => {
            // Primeira requisição
            const start1 = perf_hooks_1.performance.now();
            await request(app.getHttpServer())
                .get('/servidor/1/contratos')
                .expect(200);
            const duration1 = perf_hooks_1.performance.now() - start1;
            // Segunda requisição (deve usar cache)
            const start2 = perf_hooks_1.performance.now();
            await request(app.getHttpServer())
                .get('/servidor/1/contratos')
                .expect(200);
            const duration2 = perf_hooks_1.performance.now() - start2;
            expect(duration2).toBeLessThan(duration1 * 0.5);
        });
        it('deve atualizar cache após modificações', async () => {
            // Cria contrato
            await request(app.getHttpServer())
                .post('/contract')
                .send({
                servidorId: 1,
                valor: 10000,
            })
                .expect(201);
            // Primeira requisição após modificação
            const response1 = await request(app.getHttpServer())
                .get('/servidor/1/contratos')
                .expect(200);
            // Segunda requisição (deve retornar mesmo resultado)
            const response2 = await request(app.getHttpServer())
                .get('/servidor/1/contratos')
                .expect(200);
            expect(response1.body).toEqual(response2.body);
        });
    });
    describe('Banco de Dados', () => {
        it('deve otimizar queries complexas', async () => {
            const start = perf_hooks_1.performance.now();
            await request(app.getHttpServer())
                .get('/reports/consolidado')
                .query({
                dataInicio: '2025-01-01',
                dataFim: '2025-02-06',
                consignatariaId: 1,
            })
                .expect(200);
            const duration = perf_hooks_1.performance.now() - start;
            expect(duration).toBeLessThan(1000);
        });
        it('deve usar índices eficientemente', async () => {
            const queryPlans = await Promise.all([
                request(app.getHttpServer())
                    .get('/servidor/search')
                    .query({ cpf: '12345678900' }),
                request(app.getHttpServer())
                    .get('/servidor/search')
                    .query({ matricula: '123456' }),
            ]);
            queryPlans.forEach(plan => {
                expect(plan.body.queryPlan.isIndexScan).toBe(true);
            });
        });
    });
    describe('Websockets', () => {
        it('deve manter latência baixa com múltiplas conexões', async () => {
            const connections = Array(100).fill(0).map(() => new WebSocket('ws://localhost:3000'));
            const latencies = await Promise.all(connections.map(ws => {
                const start = perf_hooks_1.performance.now();
                return new Promise(resolve => {
                    ws.send('ping');
                    ws.onmessage = () => {
                        resolve(perf_hooks_1.performance.now() - start);
                    };
                });
            }));
            const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
            expect(avgLatency).toBeLessThan(50);
        });
    });
});
