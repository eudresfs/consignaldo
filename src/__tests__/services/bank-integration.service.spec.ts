import { Test, TestingModule } from '@nestjs/testing';
import { BankIntegrationService } from '../../services/bank-integration.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../../infrastructure/crypto/crypto.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { 
  BankIntegrationException,
  InvalidWebhookSignatureException 
} from '../../domain/exceptions/bank-integration.exception';
import { WebhookEvent } from '../../domain/interfaces/bank-integration.interface';

describe('BankIntegrationService', () => {
  let service: BankIntegrationService;
  let prisma: PrismaService;
  let queue: QueueService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankIntegrationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
        {
          provide: CryptoService,
          useValue: mockCrypto,
        },
        {
          provide: QueueService,
          useValue: mockQueue,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<BankIntegrationService>(BankIntegrationService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get<QueueService>(QueueService);
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

      await expect(service.importProposals(1)).rejects.toThrow(
        BankIntegrationException,
      );
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

      await expect(service.exportContract('1', 1)).rejects.toThrow(
        'Contract 1 not found',
      );
    });
  });

  describe('handleWebhook', () => {
    const mockPayload = {
      event: WebhookEvent.PROPOSAL_CREATED,
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

      expect(prisma.proposal.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { externalId: '1' },
          update: expect.any(Object),
          create: expect.any(Object),
        }),
      );
    });

    it('deve falhar se assinatura inválida', async () => {
      await expect(
        service.handleWebhook(
          { ...mockPayload, signature: 'invalid' },
          1,
        ),
      ).rejects.toThrow(InvalidWebhookSignatureException);
    });
  });
});
