import { Test, TestingModule } from '@nestjs/testing';
import { BankIntegrationService } from '../../../services/bank-integration.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../../../infrastructure/crypto/crypto.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { WebhookEvent } from '../../../domain/interfaces/bank-integration.interface';
import { Logger } from '@nestjs/common';

describe('BankIntegrationService', () => {
  let service: BankIntegrationService;
  let prisma: PrismaService;
  let config: ConfigService;
  let crypto: CryptoService;
  let queue: QueueService;
  let cache: CacheService;

  const mockBankConfig = {
    id: 1,
    active: true,
    apiUrl: 'https://api.bank.com',
    apiKey: 'test-key',
    webhookSecret: 'test-secret',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankIntegrationService,
        {
          provide: PrismaService,
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
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
            verifySignature: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BankIntegrationService>(BankIntegrationService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
    crypto = module.get<CryptoService>(CryptoService);
    queue = module.get<QueueService>(QueueService);
    cache = module.get<CacheService>(CacheService);
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

      jest.spyOn(service as any, 'fetchProposalsFromBank')
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
      jest.spyOn(service as any, 'fetchProposalsFromBank')
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
        .mockResolvedValue(mockContract as any);
      
      jest.spyOn(service as any, 'sendContractToBank')
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
      event: WebhookEvent.PROPOSAL_CREATED,
      data: {
        id: '1',
        status: 'APPROVED',
      },
      signature: 'valid-signature',
    };

    beforeEach(() => {
      jest.spyOn(service as any, 'verifyWebhookSignature')
        .mockReturnValue(true);
    });

    it('deve processar webhook de proposta com sucesso', async () => {
      jest.spyOn(service as any, 'handleProposalWebhook')
        .mockResolvedValue(undefined);

      await service.handleWebhook(mockPayload, 1);

      expect(service['handleProposalWebhook'])
        .toHaveBeenCalledWith(mockPayload.data);
    });

    it('deve rejeitar webhook com assinatura inválida', async () => {
      jest.spyOn(service as any, 'verifyWebhookSignature')
        .mockReturnValue(false);

      await expect(service.handleWebhook(mockPayload, 1))
        .rejects
        .toThrow('Invalid webhook signature');
    });

    it('deve logar aviso para eventos desconhecidos', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');
      
      await service.handleWebhook({
        ...mockPayload,
        event: 'UNKNOWN_EVENT' as WebhookEvent,
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
      expect(cache.set).toHaveBeenCalledWith(
        'bank-config:1',
        mockBankConfig,
        expect.any(Number)
      );
    });
  });
});
