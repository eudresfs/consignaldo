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
const setup_1 = require("./setup");
const request = __importStar(require("supertest"));
describe('Fluxo de Empréstimo (E2E)', () => {
    let testManager;
    let servidor;
    let consignataria;
    let produto;
    beforeAll(async () => {
        testManager = new setup_1.IntegrationTestManager();
        await testManager.init();
    });
    beforeEach(async () => {
        // Cria dados base para os testes
        servidor = await testManager.createServidor();
        consignataria = await testManager.createConsignataria();
        produto = await testManager.createProduto(consignataria.id);
        await testManager.createMargem(servidor.id);
    });
    afterAll(async () => {
        await testManager.cleanup();
    });
    describe('Fluxo Completo', () => {
        it('deve completar fluxo de empréstimo com sucesso', async () => {
            // 1. Simula empréstimo
            const simulacao = await request(testManager.getHttpServer())
                .post('/loan-simulation/simulate')
                .send({
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
                valorSolicitado: 10000,
                prazo: 24,
            })
                .expect(201);
            expect(simulacao.body).toHaveProperty('valorParcela');
            expect(simulacao.body.valorParcela).toBeLessThanOrEqual(1500); // margem disponível
            // 2. Cria proposta
            const proposta = await request(testManager.getHttpServer())
                .post('/proposal')
                .send({
                simulacaoId: simulacao.body.id,
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
                valorSolicitado: simulacao.body.valorSolicitado,
                prazo: simulacao.body.prazo,
                valorParcela: simulacao.body.valorParcela,
            })
                .expect(201);
            expect(proposta.body).toHaveProperty('id');
            expect(proposta.body.status).toBe('PENDING');
            // 3. Banco aprova proposta via webhook
            await request(testManager.getHttpServer())
                .post(`/bank-integration/webhook/${consignataria.id}`)
                .send({
                event: 'PROPOSAL_UPDATED',
                data: {
                    id: proposta.body.id,
                    status: 'APPROVED',
                },
                timestamp: new Date(),
                signature: 'valid-signature', // Mock
            })
                .expect(200);
            // 4. Verifica status da proposta
            const propostaAtualizada = await request(testManager.getHttpServer())
                .get(`/proposal/${proposta.body.id}`)
                .expect(200);
            expect(propostaAtualizada.body.status).toBe('APPROVED');
            // 5. Cria contrato
            const contrato = await request(testManager.getHttpServer())
                .post('/contract')
                .send({
                propostaId: proposta.body.id,
                numeroContrato: '123456',
                dataInicio: new Date(),
            })
                .expect(201);
            expect(contrato.body).toHaveProperty('id');
            expect(contrato.body.status).toBe('AGUARDANDO');
            // 6. Verifica margem atualizada
            const margem = await request(testManager.getHttpServer())
                .get(`/margem/${servidor.id}/atual`)
                .expect(200);
            expect(margem.body.disponivel).toBe(1500 - simulacao.body.valorParcela);
            expect(margem.body.utilizada).toBe(500 + simulacao.body.valorParcela);
        });
        it('deve falhar se margem insuficiente', async () => {
            // Cria margem com valor baixo
            await testManager.getPrisma().margem.updateMany({
                where: { servidorId: servidor.id },
                data: { disponivel: 100 },
            });
            // Tenta simular empréstimo
            const response = await request(testManager.getHttpServer())
                .post('/loan-simulation/simulate')
                .send({
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
                valorSolicitado: 10000,
                prazo: 24,
            })
                .expect(400);
            expect(response.body.code).toBe('MARGEM_INSUFICIENTE');
        });
        it('deve permitir refinanciamento', async () => {
            // Primeiro cria um contrato ativo
            const contratoAtivo = await testManager.getPrisma().contract.create({
                data: {
                    servidorId: servidor.id,
                    consignatariaId: consignataria.id,
                    valorTotal: 10000,
                    valorParcela: 500,
                    prazo: 24,
                    parcelasPagas: 6,
                    status: 'AVERBADO',
                },
            });
            // Simula refinanciamento
            const simulacao = await request(testManager.getHttpServer())
                .post(`/loan-simulation/refinance/${contratoAtivo.id}`)
                .send({
                prazo: 36,
            })
                .expect(201);
            expect(simulacao.body.valorParcela).toBeLessThan(500); // Parcela menor
            expect(simulacao.body.economiaTotal).toBeGreaterThan(0);
        });
    });
    describe('Validações de Negócio', () => {
        it('deve validar dia de corte', async () => {
            // Configura dia de corte como dia 5
            await testManager.getPrisma().consignataria.update({
                where: { id: consignataria.id },
                data: { diaCorte: 5 },
            });
            // Tenta criar proposta após dia de corte
            const response = await request(testManager.getHttpServer())
                .post('/proposal')
                .send({
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
                valorSolicitado: 10000,
                prazo: 24,
            })
                .expect(400);
            expect(response.body.code).toBe('DIA_CORTE_INVALIDO');
        });
        it('deve validar limite de crédito', async () => {
            const response = await request(testManager.getHttpServer())
                .post('/loan-simulation/simulate')
                .send({
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
                valorSolicitado: 100000, // Acima do limite
                prazo: 24,
            })
                .expect(400);
            expect(response.body.code).toBe('VALOR_FORA_LIMITE');
        });
    });
    describe('Métricas de Performance', () => {
        it('deve responder simulação em menos de 200ms', async () => {
            const start = Date.now();
            await request(testManager.getHttpServer())
                .post('/loan-simulation/simulate')
                .send({
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
                valorSolicitado: 10000,
                prazo: 24,
            })
                .expect(201);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(200);
        });
    });
});
