"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../../app.module");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../services/audit.service");
const compliance_service_1 = require("../../services/compliance.service");
const loan_simulation_service_1 = require("../../services/loan-simulation.service");
describe('Testes de Conformidade', () => {
    let app;
    let prisma;
    let auditService;
    let complianceService;
    let loanService;
    beforeAll(async () => {
        app = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        prisma = app.get(prisma_service_1.PrismaService);
        auditService = app.get(audit_service_1.AuditService);
        complianceService = app.get(compliance_service_1.ComplianceService);
        loanService = app.get(loan_simulation_service_1.LoanSimulationService);
    });
    describe('LGPD', () => {
        it('deve mascarar dados sensíveis em logs', async () => {
            const logs = await auditService.getLogs({
                entity: 'servidor',
                action: 'CREATE',
            });
            logs.forEach(log => {
                // Verifica CPF mascarado
                expect(log.data).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
                // Verifica dados bancários mascarados
                expect(log.data).not.toMatch(/\d{4}-\d{4}-\d{4}-\d{4}/);
            });
        });
        it('deve registrar consentimento do usuário', async () => {
            const consent = {
                userId: '1',
                purposes: ['credit-analysis', 'marketing'],
                expiration: new Date('2026-02-06'),
            };
            await complianceService.registerConsent(consent);
            const stored = await prisma.userConsent.findFirst({
                where: { userId: '1' },
            });
            expect(stored.purposes).toContain('credit-analysis');
            expect(stored.expiration).toBeDefined();
        });
        it('deve permitir exclusão de dados pessoais', async () => {
            const userId = '2';
            await complianceService.deletePersonalData(userId);
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            expect(user.nome).toBe('[REMOVIDO]');
            expect(user.cpf).toBe('[REMOVIDO]');
            expect(user.email).toBe('[REMOVIDO]');
        });
    });
    describe('Bacen', () => {
        it('deve calcular CET corretamente', async () => {
            const simulacao = await loanService.simulate({
                valor: 10000,
                prazo: 24,
                taxaJuros: 1.99,
                taxaIof: 0.38,
            });
            expect(simulacao.cet).toBeCloseTo(26.8, 1); // 26.8% ao ano
            expect(simulacao.cetMensal).toBeCloseTo(2.0, 1); // 2.0% ao mês
        });
        it('deve validar margem consignável', async () => {
            const servidor = await prisma.servidor.create({
                data: {
                    nome: 'Test',
                    cpf: '12345678900',
                    salario: 5000,
                },
            });
            const simulacao = await loanService.simulate({
                servidorId: servidor.id,
                valor: 50000, // Valor que ultrapassa margem
                prazo: 24,
            });
            expect(simulacao.validacoes.margemExcedida).toBe(true);
            expect(simulacao.valorMaximo).toBeLessThanOrEqual(servidor.salario * 0.3);
        });
        it('deve gerar relatórios regulatórios', async () => {
            const report = await complianceService.generateBacenReport({
                tipo: 'SCR',
                data: new Date('2025-02-06'),
            });
            expect(report.header).toMatchObject({
                cnpj: expect.any(String),
                data: expect.any(Date),
                versao: expect.any(String),
            });
            expect(report.operacoes).toBeInstanceOf(Array);
        });
    });
    describe('Auditoria', () => {
        it('deve registrar todas alterações', async () => {
            const servidor = await prisma.servidor.create({
                data: {
                    nome: 'Test',
                    cpf: '12345678900',
                },
            });
            await prisma.servidor.update({
                where: { id: servidor.id },
                data: { nome: 'Test Updated' },
            });
            const logs = await auditService.getLogs({
                entity: 'servidor',
                entityId: servidor.id,
            });
            expect(logs).toHaveLength(2); // CREATE + UPDATE
            expect(logs[0].action).toBe('CREATE');
            expect(logs[1].action).toBe('UPDATE');
        });
        it('deve manter histórico de acessos', async () => {
            const accessLog = await auditService.logAccess({
                userId: '1',
                resource: '/api/contratos',
                method: 'GET',
                ip: '1.2.3.4',
            });
            expect(accessLog).toMatchObject({
                timestamp: expect.any(Date),
                userId: '1',
                resource: '/api/contratos',
            });
        });
    });
    describe('Políticas de Segurança', () => {
        it('deve validar senha forte', async () => {
            const result = await complianceService.validatePassword('senha123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Mínimo 8 caracteres');
            expect(result.errors).toContain('Requer caracteres especiais');
            const strongResult = await complianceService.validatePassword('S3nh@F0rt3!');
            expect(strongResult.valid).toBe(true);
        });
        it('deve exigir MFA para operações sensíveis', async () => {
            const operation = await complianceService.requiresMFA({
                type: 'contract-approval',
                value: 50000,
            });
            expect(operation.requiresMFA).toBe(true);
            expect(operation.reason).toBe('high-value-operation');
        });
        it('deve registrar tentativas de acesso', async () => {
            await complianceService.logLoginAttempt({
                userId: '1',
                success: false,
                ip: '1.2.3.4',
            });
            const attempts = await prisma.loginAttempt.findMany({
                where: { userId: '1' },
                orderBy: { timestamp: 'desc' },
                take: 1,
            });
            expect(attempts[0]).toMatchObject({
                userId: '1',
                success: false,
                ip: '1.2.3.4',
            });
        });
    });
});
