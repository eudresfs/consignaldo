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
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const bank_integration_service_1 = require("../../services/bank-integration.service");
const circuit_breaker_1 = require("../../infrastructure/resilience/circuit-breaker");
const retry_1 = require("../../infrastructure/resilience/retry");
const rate_limiter_1 = require("../../infrastructure/resilience/rate-limiter");
const nock = __importStar(require("nock"));
describe('Testes de Resiliência', () => {
    let app;
    let bankService;
    let prisma;
    beforeAll(async () => {
        app = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        bankService = app.get(bank_integration_service_1.BankIntegrationService);
        prisma = app.get(prisma_service_1.PrismaService);
    });
    describe('Circuit Breaker', () => {
        it('deve abrir circuito após múltiplas falhas', async () => {
            const circuitBreaker = new circuit_breaker_1.CircuitBreaker({
                failureThreshold: 3,
                resetTimeout: 5000,
            });
            // Simula falhas consecutivas
            nock('http://api.banco.com')
                .get('/status')
                .times(5)
                .replyWithError('connection refused');
            let failures = 0;
            for (let i = 0; i < 5; i++) {
                try {
                    await circuitBreaker.execute(() => bankService.checkBankStatus('BANCO_A'));
                }
                catch (error) {
                    failures++;
                }
            }
            expect(failures).toBe(5);
            expect(circuitBreaker.isOpen()).toBe(true);
        });
        it('deve fechar circuito após tempo de reset', async () => {
            const circuitBreaker = new circuit_breaker_1.CircuitBreaker({
                failureThreshold: 3,
                resetTimeout: 1000,
            });
            // Força circuito aberto
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            expect(circuitBreaker.isOpen()).toBe(true);
            // Espera reset
            await new Promise(resolve => setTimeout(resolve, 1100));
            expect(circuitBreaker.isOpen()).toBe(false);
        });
    });
    describe('Retry com Backoff', () => {
        it('deve tentar novamente com backoff exponencial', async () => {
            const retry = new retry_1.RetryWithBackoff({
                maxAttempts: 3,
                initialDelay: 100,
                maxDelay: 1000,
            });
            let attempts = 0;
            const operation = jest.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3)
                    throw new Error('falha temporária');
                return 'sucesso';
            });
            const result = await retry.execute(operation);
            expect(result).toBe('sucesso');
            expect(attempts).toBe(3);
        });
        it('deve respeitar delay máximo', async () => {
            const retry = new retry_1.RetryWithBackoff({
                maxAttempts: 5,
                initialDelay: 100,
                maxDelay: 200,
            });
            const start = Date.now();
            try {
                await retry.execute(() => {
                    throw new Error('falha');
                });
            }
            catch (error) {
                const duration = Date.now() - start;
                // 5 tentativas com delay máximo de 200ms = ~1000ms
                expect(duration).toBeLessThan(1100);
            }
        });
    });
    describe('Rate Limiter', () => {
        it('deve limitar requisições por IP', async () => {
            const limiter = new rate_limiter_1.RateLimiter({
                windowMs: 1000,
                max: 3,
            });
            const ip = '1.2.3.4';
            // Primeiras 3 requisições devem passar
            expect(await limiter.tryAcquire(ip)).toBe(true);
            expect(await limiter.tryAcquire(ip)).toBe(true);
            expect(await limiter.tryAcquire(ip)).toBe(true);
            // 4ª requisição deve ser bloqueada
            expect(await limiter.tryAcquire(ip)).toBe(false);
        });
        it('deve resetar limite após janela de tempo', async () => {
            const limiter = new rate_limiter_1.RateLimiter({
                windowMs: 100,
                max: 1,
            });
            const ip = '1.2.3.4';
            expect(await limiter.tryAcquire(ip)).toBe(true);
            expect(await limiter.tryAcquire(ip)).toBe(false);
            await new Promise(resolve => setTimeout(resolve, 150));
            expect(await limiter.tryAcquire(ip)).toBe(true);
        });
    });
    describe('Fallback e Degradação Graciosa', () => {
        it('deve usar cache em caso de falha do banco', async () => {
            // Simula falha no banco
            nock('http://api.banco.com')
                .get('/taxas')
                .replyWithError('connection refused');
            const taxas = await bankService.getTaxasJuros('BANCO_A', {
                useFallback: true,
            });
            expect(taxas).toBeDefined();
            expect(taxas.source).toBe('cache');
        });
        it('deve degradar funcionalidades não essenciais', async () => {
            // Simula alto uso de CPU
            const highLoad = true;
            const result = await bankService.processarProposta({
                id: '1',
                highLoad,
            });
            // Verifica se features não essenciais foram desabilitadas
            expect(result.analiseDetalhada).toBeUndefined();
            expect(result.scoreCompleto).toBeUndefined();
            expect(result.basicProposal).toBeDefined();
        });
    });
    describe('Isolamento de Falhas', () => {
        it('deve isolar falhas por banco', async () => {
            // Simula falha em um banco específico
            nock('http://banco-a.com')
                .get('/status')
                .replyWithError('connection refused');
            nock('http://banco-b.com')
                .get('/status')
                .reply(200, { status: 'ok' });
            const results = await Promise.allSettled([
                bankService.checkBankStatus('BANCO_A'),
                bankService.checkBankStatus('BANCO_B'),
            ]);
            expect(results[0].status).toBe('rejected');
            expect(results[1].status).toBe('fulfilled');
        });
        it('deve manter bulkhead entre operações', async () => {
            const bulkhead = {
                importacao: { concurrent: 0, max: 3 },
                processamento: { concurrent: 0, max: 5 },
            };
            // Simula operações concorrentes
            const ops = [];
            for (let i = 0; i < 10; i++) {
                const type = i % 2 === 0 ? 'importacao' : 'processamento';
                if (bulkhead[type].concurrent < bulkhead[type].max) {
                    bulkhead[type].concurrent++;
                    ops.push(bankService.executarOperacao(type).finally(() => {
                        bulkhead[type].concurrent--;
                    }));
                }
            }
            await Promise.allSettled(ops);
            expect(bulkhead.importacao.concurrent).toBe(0);
            expect(bulkhead.processamento.concurrent).toBe(0);
        });
    });
});
