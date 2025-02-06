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
const prisma_service_1 = require("../../../infrastructure/database/prisma.service");
const status_contrato_enum_1 = require("../../../domain/enums/status-contrato.enum");
describe('Fluxo de Empréstimo (e2e)', () => {
    let app;
    let prisma;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = app.get(prisma_service_1.PrismaService);
        await app.init();
    });
    beforeEach(async () => {
        // Limpa dados de teste
        await prisma.contrato.deleteMany();
        await prisma.servidor.deleteMany();
        await prisma.consignataria.deleteMany();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Fluxo Completo', () => {
        it('deve completar fluxo de empréstimo com sucesso', async () => {
            // 1. Criar servidor
            const servidor = await prisma.servidor.create({
                data: {
                    nome: 'João Silva',
                    cpf: '12345678900',
                    matricula: '123456',
                    salario: 5000,
                },
            });
            // 2. Criar consignatária
            const consignataria = await prisma.consignataria.create({
                data: {
                    nome: 'Banco ABC',
                    codigo: 'ABC',
                    taxaJuros: 1.99,
                },
            });
            // 3. Simular empréstimo
            const simulacao = await request(app.getHttpServer())
                .post('/loan-simulation')
                .send({
                valor: 10000,
                prazo: 24,
                taxaJuros: consignataria.taxaJuros,
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
            })
                .expect(201);
            expect(simulacao.body).toHaveProperty('parcela');
            expect(simulacao.body.parcela).toBeLessThanOrEqual(servidor.salario * 0.3);
            // 4. Criar proposta
            const proposta = await request(app.getHttpServer())
                .post('/loan-proposal')
                .send({
                simulacaoId: simulacao.body.id,
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
            })
                .expect(201);
            expect(proposta.body.status).toBe(status_contrato_enum_1.StatusContrato.AGUARDANDO);
            // 5. Aprovar proposta
            const contratoAprovado = await request(app.getHttpServer())
                .patch(`/loan-proposal/${proposta.body.id}/approve`)
                .send({
                consignatariaId: consignataria.id,
            })
                .expect(200);
            expect(contratoAprovado.body.status).toBe(status_contrato_enum_1.StatusContrato.AVERBADO);
            // 6. Verificar margem atualizada
            const margemAtual = await request(app.getHttpServer())
                .get(`/servidor/${servidor.id}/margem`)
                .expect(200);
            expect(margemAtual.body.disponivel).toBe(servidor.salario * 0.3 - simulacao.body.parcela);
        });
        it('deve rejeitar proposta quando excede margem', async () => {
            // 1. Criar servidor
            const servidor = await prisma.servidor.create({
                data: {
                    nome: 'Maria Santos',
                    cpf: '98765432100',
                    matricula: '654321',
                    salario: 3000,
                },
            });
            // 2. Criar consignatária
            const consignataria = await prisma.consignataria.create({
                data: {
                    nome: 'Banco XYZ',
                    codigo: 'XYZ',
                    taxaJuros: 2.5,
                },
            });
            // 3. Tentar simular empréstimo acima da margem
            await request(app.getHttpServer())
                .post('/loan-simulation')
                .send({
                valor: 20000, // Valor alto para gerar parcela acima da margem
                prazo: 24,
                taxaJuros: consignataria.taxaJuros,
                servidorId: servidor.id,
                consignatariaId: consignataria.id,
            })
                .expect(400);
        });
    });
    describe('Refinanciamento', () => {
        it('deve permitir refinanciar contrato existente', async () => {
            // Setup inicial...
            const servidor = await prisma.servidor.create({
                data: {
                    nome: 'Pedro Costa',
                    cpf: '45678912300',
                    matricula: '789123',
                    salario: 6000,
                },
            });
            // Criar contrato existente...
            const contratoExistente = await prisma.contrato.create({
                data: {
                    valor: 10000,
                    prazo: 24,
                    parcela: 500,
                    status: status_contrato_enum_1.StatusContrato.AVERBADO,
                    servidorId: servidor.id,
                    // ... outros campos necessários
                },
            });
            // Solicitar refinanciamento
            const refinanciamento = await request(app.getHttpServer())
                .post('/loan-refinancing')
                .send({
                contratoId: contratoExistente.id,
                novoValor: 15000,
                novoPrazo: 36,
            })
                .expect(201);
            expect(refinanciamento.body).toHaveProperty('parcela');
            expect(refinanciamento.body.status).toBe(status_contrato_enum_1.StatusContrato.AGUARDANDO);
            // Verificar contrato original
            const contratoOriginal = await prisma.contrato.findUnique({
                where: { id: contratoExistente.id },
            });
            expect(contratoOriginal.status).toBe(status_contrato_enum_1.StatusContrato.LIQUIDADO);
        });
    });
});
