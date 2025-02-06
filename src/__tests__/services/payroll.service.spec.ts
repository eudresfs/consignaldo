import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from '../../services/payroll.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { NotificationService } from '../../services/notification.service';
import { ConfigService } from '@nestjs/config';
import { 
  PayrollImportException,
  InvalidPayrollFileException 
} from '../../domain/exceptions/payroll.exception';
import { PayrollStatus } from '../../domain/interfaces/payroll.interface';
import * as crypto from 'crypto';

describe('PayrollService', () => {
  let service: PayrollService;
  let prisma: PrismaService;
  let storage: StorageService;
  let queue: QueueService;

  const mockPrisma = {
    payrollImport: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    payrollTemplate: {
      findFirst: jest.fn(),
    },
    servidor: {
      upsert: jest.fn(),
    },
    margem: {
      create: jest.fn(),
    },
    desconto: {
      create: jest.fn(),
    },
    contract: {
      findMany: jest.fn(),
    },
  };

  const mockStorage = {
    upload: jest.fn(),
    download: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockNotification = {
    send: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: StorageService,
          useValue: mockStorage,
        },
        {
          provide: QueueService,
          useValue: mockQueue,
        },
        {
          provide: NotificationService,
          useValue: mockNotification,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    prisma = module.get<PrismaService>(PrismaService);
    storage = module.get<StorageService>(StorageService);
    queue = module.get<QueueService>(QueueService);
  });

  describe('importPayroll', () => {
    const mockFile = {
      originalname: 'folha.csv',
      buffer: Buffer.from('test'),
    };

    const mockTemplate = {
      id: 1,
      delimiter: ',',
      encoding: 'utf-8',
      skipLines: 1,
      columns: [],
    };

    beforeEach(() => {
      mockPrisma.payrollTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockStorage.upload.mockResolvedValue(undefined);
      mockQueue.add.mockResolvedValue(undefined);
    });

    it('deve importar arquivo com sucesso', async () => {
      const result = await service.importPayroll(1, mockFile as any, '2025-02');

      expect(result).toBeDefined();
      expect(result.status).toBe(PayrollStatus.PENDING);
      expect(queue.add).toHaveBeenCalledWith(
        'process-payroll',
        expect.any(Object)
      );
    });

    it('deve validar checksum do arquivo', async () => {
      const buffer = Buffer.from('test');
      const checksum = crypto
        .createHash('md5')
        .update(buffer)
        .digest('hex');

      await service.importPayroll(1, {
        ...mockFile,
        buffer,
        checksum,
      } as any, '2025-02');

      expect(storage.upload).toHaveBeenCalled();
    });

    it('deve falhar se template não encontrado', async () => {
      mockPrisma.payrollTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.importPayroll(1, mockFile as any, '2025-02')
      ).rejects.toThrow(PayrollImportException);
    });
  });

  describe('processPayroll', () => {
    const mockImport = {
      id: '1',
      consignanteId: 1,
      fileName: 'folha.csv',
      status: PayrollStatus.PENDING,
      template: {
        delimiter: ',',
        encoding: 'utf-8',
        skipLines: 1,
        columns: [],
      },
    };

    const mockRecords = [
      {
        cpf: '12345678900',
        nome: 'João Silva',
        matricula: '123',
        salarioBruto: 5000,
        salarioLiquido: 4000,
        margemDisponivel: 1500,
        margemUtilizada: 500,
        descontos: [],
      },
    ];

    beforeEach(() => {
      mockPrisma.payrollImport.findUnique.mockResolvedValue(mockImport);
      mockStorage.download.mockResolvedValue(Buffer.from('test'));
    });

    it('deve processar registros com sucesso', async () => {
      await service.processPayroll('1');

      expect(prisma.servidor.upsert).toHaveBeenCalled();
      expect(prisma.margem.create).toHaveBeenCalled();
      expect(prisma.payrollImport.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: PayrollStatus.COMPLETED,
        }),
      });
    });

    it('deve lidar com erros de processamento', async () => {
      mockPrisma.servidor.upsert.mockRejectedValue(new Error('DB Error'));

      await service.processPayroll('1');

      expect(prisma.payrollImport.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: PayrollStatus.ERROR,
        }),
      });
    });
  });

  describe('reconcilePayroll', () => {
    const mockImport = {
      id: '1',
      consignanteId: 1,
      records: [
        {
          descontos: [
            { contratoId: '1', valor: 500 },
          ],
        },
      ],
    };

    const mockContracts = [
      {
        id: '1',
        valorParcela: 500,
        status: 'ACTIVE',
      },
    ];

    beforeEach(() => {
      mockPrisma.payrollImport.findUnique.mockResolvedValue(mockImport);
      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
    });

    it('deve reconciliar contratos com sucesso', async () => {
      const result = await service.reconcilePayroll('1');

      expect(result).toHaveLength(mockContracts.length);
      expect(result[0].status).toBe('MATCHED');
    });

    it('deve identificar divergências', async () => {
      mockImport.records[0].descontos[0].valor = 600;

      const result = await service.reconcilePayroll('1');

      expect(result[0].status).toBe('DIVERGENT');
      expect(result[0].difference).toBe(100);
    });

    it('deve notificar problemas', async () => {
      mockImport.records[0].descontos = [];

      await service.reconcilePayroll('1');

      expect(mockNotification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RECONCILIATION_ISSUE',
        })
      );
    });
  });
});
