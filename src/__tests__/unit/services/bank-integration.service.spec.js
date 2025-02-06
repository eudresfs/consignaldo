"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bank_integration_service_1 = require("../../../services/bank-integration.service");
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const crypto_service_1 = require("../../../infrastructure/crypto/crypto.service");
const queue_service_1 = require("../../../infrastructure/queue/queue.service");
const cache_service_1 = require("../../../infrastructure/cache/cache.service");
const bank_integration_interface_1 = require("../../../domain/interfaces/bank-integration.interface");
const common_1 = require("@nestjs/common");
describe('BankIntegrationService', () => {
    let service;
    let prisma;
    let config;
    let crypto;
    let queue;
    let cache;
    const mockBankConfig = {
        id: 1,
        active: true,
        apiUrl: 'https://api.bank.com',
        apiKey: 'test-key',
        webhookSecret: 'test-secret',
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                bank_integration_service_1.BankIntegrationService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        bankIntegration: {
                            findUnique: jest.fn().mockResolvedValue(mockBankConfig),
                        },
                        contract: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: crypto_service_1.CryptoService,
                    useValue: {
                        encrypt: jest.fn(),
                        decrypt: jest.fn(),
                        verifySignature: jest.fn(),
                    },
                },
                {
                    provide: queue_service_1.QueueService,
                    useValue: {
                        add: jest.fn(),
                    },
                },
                {
                    provide: cache_service_1.CacheService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(bank_integration_service_1.BankIntegrationService);
        prisma = module.get(prisma_service_1.PrismaService);
        config = module.get(config_1.ConfigService);
        crypto = module.get(crypto_service_1.CryptoService);
        queue = module.get(queue_service_1.QueueService);
        cache = module.get(cache_service_1.CacheService);
    });
    describe('importProposals', () => {
        it('deve importar propostas com sucesso', async () => {
            const mockProposals = [
                {
                    id: '1',
                    value: 10000,
                    term: 24,
                    status: 'PENDING',
                },
            ];
            jest.spyOn(service, 'fetchProposalsFromBank')
                .mockResolvedValue(mockProposals);
            const result = await service.importProposals(1);
            expect(result).toEqual(mockProposals);
            expect(queue.add).toHaveBeenCalledWith('process-proposals', {
                bankId: 1,
                proposals: mockProposals,
            });
        });
        it('deve lançar erro se banco estiver inativo', async () => {
            jest.spyOn(prisma.bankIntegration, 'findUnique')
                .mockResolvedValue({ ...mockBankConfig, active: false });
            await expect(service.importProposals(1))
                .rejects
                .toThrow('Bank integration 1 is not active');
        });
        it('deve lidar com erros na importação', async () => {
            jest.spyOn(service, 'fetchProposalsFromBank')
                .mockRejectedValue(new Error('API Error'));
            await expect(service.importProposals(1))
                .rejects
                .toThrow('API Error');
        });
    });
    describe('exportContract', () => {
        const mockContract = {
            id: '1',
            proposal: {
                id: '1',
                value: 10000,
            },
            documents: [
                { id: '1', type: 'CCB' },
            ],
        };
        it('deve exportar contrato com sucesso', async () => {
            jest.spyOn(prisma.contract, 'findUnique')
                .mockResolvedValue(mockContract);
            jest.spyOn(service, 'sendContractToBank')
                .mockResolvedValue(undefined);
            await service.exportContract('1', 1);
            expect(prisma.contract.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    exportedAt: expect.any(Date),
                    status: 'EXPORTED',
                },
            });
        });
        it('deve lançar erro se contrato não existir', async () => {
            jest.spyOn(prisma.contract, 'findUnique')
                .mockResolvedValue(null);
            await expect(service.exportContract('1', 1))
                .rejects
                .toThrow('Contract 1 not found');
        });
    });
    describe('handleWebhook', () => {
        const mockPayload = {
            event: bank_integration_interface_1.WebhookEvent.PROPOSAL_CREATED,
            data: {
                id: '1',
                status: 'APPROVED',
            },
            signature: 'valid-signature',
        };
        beforeEach(() => {
            jest.spyOn(service, 'verifyWebhookSignature')
                .mockReturnValue(true);
        });
        it('deve processar webhook de proposta com sucesso', async () => {
            jest.spyOn(service, 'handleProposalWebhook')
                .mockResolvedValue(undefined);
            await service.handleWebhook(mockPayload, 1);
            expect(service['handleProposalWebhook'])
                .toHaveBeenCalledWith(mockPayload.data);
        });
        it('deve rejeitar webhook com assinatura inválida', async () => {
            jest.spyOn(service, 'verifyWebhookSignature')
                .mockReturnValue(false);
            await expect(service.handleWebhook(mockPayload, 1))
                .rejects
                .toThrow('Invalid webhook signature');
        });
        it('deve logar aviso para eventos desconhecidos', async () => {
            const loggerSpy = jest.spyOn(common_1.Logger.prototype, 'warn');
            await service.handleWebhook({
                ...mockPayload,
                event: 'UNKNOWN_EVENT',
            }, 1);
            expect(loggerSpy)
                .toHaveBeenCalledWith('Unknown webhook event: UNKNOWN_EVENT');
        });
    });
    describe('getBankConfig', () => {
        it('deve retornar configuração do cache', async () => {
            jest.spyOn(cache, 'get')
                .mockResolvedValue(mockBankConfig);
            const result = await service['getBankConfig'](1);
            expect(result).toEqual(mockBankConfig);
            expect(prisma.bankIntegration.findUnique)
                .not
                .toHaveBeenCalled();
        });
        it('deve buscar e cachear configuração do banco de dados', async () => {
            jest.spyOn(cache, 'get')
                .mockResolvedValue(null);
            const result = await service['getBankConfig'](1);
            expect(result).toEqual(mockBankConfig);
            expect(cache.set).toHaveBeenCalledWith('bank-config:1', mockBankConfig, expect.any(Number));
        });
    });
});
