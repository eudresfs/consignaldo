"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const loan_simulation_service_1 = require("../../services/loan-simulation.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const cache_service_1 = require("../../infrastructure/cache/cache.service");
const financial_util_1 = require("../../infrastructure/utils/financial.util");
const loan_simulation_exception_1 = require("../../domain/exceptions/loan-simulation.exception");
describe('LoanSimulationService', () => {
    let service;
    let prisma;
    let financial;
    const mockPrisma = {
        margem: {
            findFirst: jest.fn(),
        },
        loanProduct: {
            findFirst: jest.fn(),
        },
        contract: {
            findUnique: jest.fn(),
        },
        desconto: {
            count: jest.fn(),
        },
    };
    const mockConfig = {
        get: jest.fn(),
    };
    const mockCache = {
        get: jest.fn(),
        set: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                loan_simulation_service_1.LoanSimulationService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfig,
                },
                {
                    provide: cache_service_1.CacheService,
                    useValue: mockCache,
                },
                financial_util_1.FinancialUtil,
            ],
        }).compile();
        service = module.get(loan_simulation_service_1.LoanSimulationService);
        prisma = module.get(prisma_service_1.PrismaService);
        financial = module.get(financial_util_1.FinancialUtil);
    });
    describe('simulate', () => {
        const mockServidor = {
            id: 1,
            cpf: '12345678900',
            margem: 1000,
        };
        const mockProduto = {
            id: 1,
            valorMinimo: 5000,
            valorMaximo: 50000,
            prazoMinimo: 12,
            prazoMaximo: 96,
            taxaJuros: 1.99,
            taxaIof: 0.38,
            tarifas: [],
        };
        beforeEach(() => {
            mockPrisma.margem.findFirst.mockResolvedValue({ disponivel: 1000 });
            mockPrisma.loanProduct.findFirst.mockResolvedValue(mockProduto);
        });
        it('deve simular empréstimo com sucesso', async () => {
            const result = await service.simulate(1, 1, 10000, 24);
            expect(result).toBeDefined();
            expect(result.valorParcela).toBeLessThanOrEqual(1000);
            expect(result.prazo).toBe(24);
            expect(result.parcelas).toHaveLength(24);
        });
        it('deve falhar se valor menor que mínimo', async () => {
            await expect(service.simulate(1, 1, 1000, 24)).rejects.toThrow(loan_simulation_exception_1.ValorForaLimiteException);
        });
        it('deve falhar se parcela maior que margem', async () => {
            mockPrisma.margem.findFirst.mockResolvedValue({ disponivel: 100 });
            await expect(service.simulate(1, 1, 10000, 24)).rejects.toThrow(loan_simulation_exception_1.MargemInsuficienteException);
        });
        it('deve calcular CET corretamente', async () => {
            const result = await service.simulate(1, 1, 10000, 24);
            expect(result.cet).toBeGreaterThan(result.taxaJuros);
            expect(result.cet).toBeLessThan(100);
        });
    });
    describe('simulateRefinancing', () => {
        const mockContrato = {
            id: '1',
            valorTotal: 10000,
            valorParcela: 500,
            numeroParcelas: 24,
            parcelasPagas: 6,
            taxaJuros: 1.99,
            status: 'ACTIVE',
        };
        beforeEach(() => {
            mockPrisma.contract.findUnique.mockResolvedValue(mockContrato);
            mockPrisma.desconto.count.mockResolvedValue(6);
        });
        it('deve simular refinanciamento com sucesso', async () => {
            const result = await service.simulateRefinancing('1', 36);
            expect(result).toBeDefined();
            expect(result.saldoDevedor).toBeLessThan(mockContrato.valorTotal);
            expect(result.economiaTotal).toBeGreaterThan(0);
        });
        it('deve falhar se contrato não encontrado', async () => {
            mockPrisma.contract.findUnique.mockResolvedValue(null);
            await expect(service.simulateRefinancing('1', 36)).rejects.toThrow('Contrato não encontrado');
        });
    });
    describe('simulatePortability', () => {
        const mockContratoOrigem = {
            id: '1',
            valorTotal: 10000,
            valorParcela: 500,
            numeroParcelas: 24,
            parcelasPagas: 6,
            taxaJuros: 2.5,
            status: 'ACTIVE',
        };
        beforeEach(() => {
            mockPrisma.contract.findUnique.mockResolvedValue(mockContratoOrigem);
            mockPrisma.desconto.count.mockResolvedValue(6);
        });
        it('deve simular portabilidade com sucesso', async () => {
            const result = await service.simulatePortability('1', 2, 36);
            expect(result).toBeDefined();
            expect(result.saldoDevedor).toBeLessThan(mockContratoOrigem.valorTotal);
            expect(result.economiaTotal).toBeGreaterThan(0);
        });
        it('deve calcular economia corretamente', async () => {
            const result = await service.simulatePortability('1', 2, 36);
            const totalOriginal = mockContratoOrigem.valorParcela * (24 - 6);
            const totalNovo = result.valorParcela * 36;
            expect(result.economiaTotal).toBe(totalOriginal - totalNovo);
        });
    });
});
