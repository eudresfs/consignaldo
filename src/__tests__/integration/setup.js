"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationTestManager = void 0;
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../../app.module");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const config_1 = require("@nestjs/config");
class IntegrationTestManager {
    async init() {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        this.app = moduleFixture.createNestApplication();
        this.prisma = this.app.get(prisma_service_1.PrismaService);
        this.config = this.app.get(config_1.ConfigService);
        await this.app.init();
    }
    async cleanup() {
        // Limpa dados de teste
        await this.prisma.$transaction([
            this.prisma.payrollImport.deleteMany(),
            this.prisma.contract.deleteMany(),
            this.prisma.proposal.deleteMany(),
            this.prisma.servidor.deleteMany(),
        ]);
        await this.app.close();
    }
    getHttpServer() {
        return this.app.getHttpServer();
    }
    getPrisma() {
        return this.prisma;
    }
    getConfig() {
        return this.config;
    }
    // Helpers para criar dados de teste
    async createServidor() {
        return this.prisma.servidor.create({
            data: {
                cpf: '12345678900',
                nome: 'João Teste',
                matricula: '123456',
                salarioBruto: 5000,
                salarioLiquido: 4000,
            },
        });
    }
    async createConsignataria() {
        return this.prisma.consignataria.create({
            data: {
                nome: 'Banco Teste',
                codigo: 'BT',
                taxaJuros: 1.99,
                status: 'ACTIVE',
            },
        });
    }
    async createProduto(consignatariaId) {
        return this.prisma.loanProduct.create({
            data: {
                consignatariaId,
                nome: 'Crédito Pessoal',
                prazoMinimo: 12,
                prazoMaximo: 96,
                valorMinimo: 5000,
                valorMaximo: 50000,
                taxaJuros: 1.99,
                taxaIof: 0.38,
                status: 'ACTIVE',
            },
        });
    }
    async createMargem(servidorId) {
        return this.prisma.margem.create({
            data: {
                servidorId,
                competencia: '2025-02',
                disponivel: 1500,
                utilizada: 500,
            },
        });
    }
}
exports.IntegrationTestManager = IntegrationTestManager;
