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
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const bank_integration_service_1 = require("../../../services/bank-integration.service");
const bank_integration_interface_1 = require("../../../domain/interfaces/bank-integration.interface");
const crypto = __importStar(require("crypto"));
describe('Integração Bancária (e2e)', () => {
    let app;
    let prisma;
    let bankService;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = app.get(prisma_service_1.PrismaService);
        bankService = app.get(bank_integration_service_1.BankIntegrationService);
        await app.init();
    });
    beforeEach(async () => {
        // Limpa dados de teste
        await prisma.contract.deleteMany();
        await prisma.proposal.deleteMany();
        await prisma.bankIntegration.deleteMany();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Fluxo de Integração', () => {
        it('deve completar ciclo de proposta com sucesso', async () => {
            // 1. Configurar integração bancária
            const bank = await prisma.bankIntegration.create({
                data: {
                    name: 'Banco Teste',
                    code: 'TST',
                    active: true,
                    apiUrl: 'https://api.test-bank.com',
                    apiKey: crypto.randomBytes(32).toString('hex'),
                    webhookSecret: crypto.randomBytes(32).toString('hex'),
                },
            });
            // 2. Criar servidor
            const servidor = await prisma.servidor.create({
                data: {
                    nome: 'João Silva',
                    cpf: '12345678900',
                    matricula: '123456',
                    salario: 5000,
                },
            });
            // 3. Criar proposta
            const proposal = await prisma.proposal.create({
                data: {
                    valor: 10000,
                    prazo: 24,
                    parcela: 500,
                    status: 'PENDING',
                    servidorId: servidor.id,
                    bankId: bank.id,
                },
            });
            // 4. Simular webhook de aprovação
            const webhookPayload = {
                event: bank_integration_interface_1.WebhookEvent.PROPOSAL_UPDATED,
                data: {
                    id: proposal.id,
                    status: 'APPROVED',
                    bankProposalId: 'BANK-123',
                },
                timestamp: new Date().toISOString(),
            };
            const signature = crypto
                .createHmac('sha256', bank.webhookSecret)
                .update(JSON.stringify(webhookPayload))
                .digest('hex');
            await request(app.getHttpServer())
                .post(`/webhook/bank/${bank.id}`)
                .set('X-Webhook-Signature', signature)
                .send(webhookPayload)
                .expect(200);
            // 5. Verificar atualização da proposta
            const updatedProposal = await prisma.proposal.findUnique({
                where: { id: proposal.id },
            });
            expect(updatedProposal).toMatchObject({
                status: 'APPROVED',
                bankProposalId: 'BANK-123',
            });
            // 6. Criar contrato
            const contract = await prisma.contract.create({
                data: {
                    proposalId: proposal.id,
                    status: 'PENDING',
                    valor: proposal.valor,
                    prazo: proposal.prazo,
                    parcela: proposal.parcela,
                },
            });
            // 7. Exportar contrato
            await bankService.exportContract(contract.id, bank.id);
            // 8. Verificar status do contrato
            const updatedContract = await prisma.contract.findUnique({
                where: { id: contract.id },
            });
            expect(updatedContract).toMatchObject({
                status: 'EXPORTED',
                exportedAt: expect.any(Date),
            });
        });
        it('deve rejeitar webhook com assinatura inválida', async () => {
            const bank = await prisma.bankIntegration.create({
                data: {
                    name: 'Banco Teste',
                    code: 'TST',
                    active: true,
                    apiUrl: 'https://api.test-bank.com',
                    apiKey: crypto.randomBytes(32).toString('hex'),
                    webhookSecret: crypto.randomBytes(32).toString('hex'),
                },
            });
            const webhookPayload = {
                event: bank_integration_interface_1.WebhookEvent.PROPOSAL_UPDATED,
                data: {
                    id: '123',
                    status: 'APPROVED',
                },
                timestamp: new Date().toISOString(),
            };
            await request(app.getHttpServer())
                .post(`/webhook/bank/${bank.id}`)
                .set('X-Webhook-Signature', 'invalid-signature')
                .send(webhookPayload)
                .expect(401);
        });
        it('deve lidar com timeout na integração', async () => {
            const bank = await prisma.bankIntegration.create({
                data: {
                    name: 'Banco Lento',
                    code: 'SLOW',
                    active: true,
                    apiUrl: 'https://slow-api.test-bank.com',
                    apiKey: crypto.randomBytes(32).toString('hex'),
                    webhookSecret: crypto.randomBytes(32).toString('hex'),
                    timeout: 1000, // 1 segundo
                },
            });
            // Mock para simular timeout
            jest.spyOn(bankService, 'fetchProposalsFromBank')
                .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));
            await expect(bankService.importProposals(bank.id)).rejects.toThrow('Request timeout');
        });
        it('deve respeitar rate limiting', async () => {
            const bank = await prisma.bankIntegration.create({
                data: {
                    name: 'Banco Rate Limited',
                    code: 'RATE',
                    active: true,
                    apiUrl: 'https://api.test-bank.com',
                    apiKey: crypto.randomBytes(32).toString('hex'),
                    webhookSecret: crypto.randomBytes(32).toString('hex'),
                    rateLimit: 2, // 2 requisições por minuto
                },
            });
            // Primeira requisição
            await request(app.getHttpServer())
                .get(`/bank/${bank.id}/proposals`)
                .expect(200);
            // Segunda requisição
            await request(app.getHttpServer())
                .get(`/bank/${bank.id}/proposals`)
                .expect(200);
            // Terceira requisição (deve ser bloqueada)
            await request(app.getHttpServer())
                .get(`/bank/${bank.id}/proposals`)
                .expect(429);
        });
    });
});
