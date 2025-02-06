"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bank_integration_service_1 = require("../../services/bank-integration.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const crypto_service_1 = require("../../infrastructure/crypto/crypto.service");
const queue_service_1 = require("../../infrastructure/queue/queue.service");
const cache_service_1 = require("../../infrastructure/cache/cache.service");
const bank_integration_exception_1 = require("../../domain/exceptions/bank-integration.exception");
const bank_integration_interface_1 = require("../../domain/interfaces/bank-integration.interface");
describe('BankIntegrationService', () => {
    let service;
    let prisma;
    let queue;
    const mockPrisma = {
        bankIntegration: {
            findUnique: jest.fn(),
        },
        contract: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        proposal: {
            upsert: jest.fn(),
        },
    };
    const mockConfig = {
        get: jest.fn(),
    };
    const mockCrypto = {
        encrypt: jest.fn(),
        decrypt: jest.fn(),
    };
    const mockQueue = {
        add: jest.fn(),
    };
    const mockCache = {
        get: jest.fn(),
        set: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                bank_integration_service_1.BankIntegrationService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfig,
                },
                {
                    provide: crypto_service_1.CryptoService,
                    useValue: mockCrypto,
                },
                {
                    provide: queue_service_1.QueueService,
                    useValue: mockQueue,
                },
                {
                    provide: cache_service_1.CacheService,
                    useValue: mockCache,
                },
            ],
        }).compile();
        service = module.get(bank_integration_service_1.BankIntegrationService);
        prisma = module.get(prisma_service_1.PrismaService);
        queue = module.get(queue_service_1.QueueService);
    });
    describe('importProposals', () => {
        const mockConfig = {
            id: 1,
            type: 'REST',
            baseUrl: 'http://api.bank.com',
            active: true,
        };
        beforeEach(() => {
            mockPrisma.bankIntegration.findUnique.mockResolvedValue(mockConfig);
        });
        it('deve importar propostas com sucesso', async () => {
            const proposals = [
                { id: '1', value: 10000 },
                { id: '2', value: 20000 },
            ];
            mockCache.get.mockResolvedValue(null);
            mockQueue.add.mockResolvedValue(undefined);
            const result = await service.importProposals(1);
            expect(result).toEqual(proposals);
            expect(queue.add).toHaveBeenCalledWith('process-proposals', {
                bankId: 1,
                proposals,
            });
        });
        it('deve falhar se integração inativa', async () => {
            mockPrisma.bankIntegration.findUnique.mockResolvedValue({
                ...mockConfig,
                active: false,
            });
            await expect(service.importProposals(1)).rejects.toThrow(bank_integration_exception_1.BankIntegrationException);
        });
    });
    describe('exportContract', () => {
        const mockContract = {
            id: '1',
            proposal: { id: '1' },
            documents: [],
        };
        beforeEach(() => {
            mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
        });
        it('deve exportar contrato com sucesso', async () => {
            await service.exportContract('1', 1);
            expect(prisma.contract.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    exportedAt: expect.any(Date),
                    status: 'EXPORTED',
                }),
            });
        });
        it('deve falhar se contrato não encontrado', async () => {
            mockPrisma.contract.findUnique.mockResolvedValue(null);
            await expect(service.exportContract('1', 1)).rejects.toThrow('Contract 1 not found');
        });
    });
    describe('handleWebhook', () => {
        const mockPayload = {
            event: bank_integration_interface_1.WebhookEvent.PROPOSAL_CREATED,
            data: { id: '1', status: 'APPROVED' },
            timestamp: new Date(),
            signature: 'valid-signature',
        };
        const mockConfig = {
            id: 1,
            password: 'secret',
        };
        beforeEach(() => {
            mockPrisma.bankIntegration.findUnique.mockResolvedValue(mockConfig);
        });
        it('deve processar webhook com sucesso', async () => {
            await service.handleWebhook(mockPayload, 1);
            expect(prisma.proposal.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: { externalId: '1' },
                update: expect.any(Object),
                create: expect.any(Object),
            }));
        });
        it('deve falhar se assinatura inválida', async () => {
            await expect(service.handleWebhook({ ...mockPayload, signature: 'invalid' }, 1)).rejects.toThrow(bank_integration_exception_1.InvalidWebhookSignatureException);
        });
    });
});
