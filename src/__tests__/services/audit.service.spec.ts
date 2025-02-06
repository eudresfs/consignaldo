import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../services/audit.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { AuditResource } from '../../domain/enums/audit-resource.enum';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;
  let queue: QueueService;

  const mockConfig = {
    enabled: true,
    resources: {
      [AuditResource.CONTRATO]: {
        actions: [AuditAction.CREATE, AuditAction.UPDATE],
        trackChanges: true,
        maskFields: ['senha', 'token'],
      },
    },
    retention: {
      days: 90,
      maxSize: 1000,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockConfig),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get<QueueService>(QueueService);
  });

  describe('log', () => {
    it('deve adicionar evento à fila quando configurado', async () => {
      const event = {
        action: AuditAction.CREATE,
        resource: AuditResource.CONTRATO,
        userId: 1,
        username: 'teste',
        status: 'SUCCESS' as const,
      };

      await service.log(event);

      expect(queue.add).toHaveBeenCalledWith(
        'audit',
        expect.objectContaining({
          action: event.action,
          resource: event.resource,
        }),
        expect.any(Object)
      );
    });

    it('não deve adicionar evento quando recurso não está configurado', async () => {
      const event = {
        action: AuditAction.CREATE,
        resource: AuditResource.AUTH,
        userId: 1,
        username: 'teste',
        status: 'SUCCESS' as const,
      };

      await service.log(event);

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('deve mascarar campos sensíveis', async () => {
      const event = {
        action: AuditAction.CREATE,
        resource: AuditResource.CONTRATO,
        userId: 1,
        username: 'teste',
        status: 'SUCCESS' as const,
        newValue: {
          nome: 'Teste',
          senha: '123456',
          token: 'abc123',
        },
      };

      await service.log(event);

      expect(queue.add).toHaveBeenCalledWith(
        'audit',
        expect.objectContaining({
          newValue: {
            nome: 'Teste',
            senha: '***',
            token: '***',
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe('search', () => {
    it('deve buscar eventos com filtros', async () => {
      const filter = {
        startDate: new Date(),
        action: AuditAction.CREATE,
        resource: AuditResource.CONTRATO,
      };

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);

      await service.search(filter);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          timestamp: {
            gte: filter.startDate,
          },
          action: filter.action,
          resource: filter.resource,
        }),
        orderBy: {
          timestamp: 'desc',
        },
        take: 1000,
      });
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas agregadas', async () => {
      const startDate = new Date();
      const endDate = new Date();

      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(100);
      jest.spyOn(prisma.auditLog, 'groupBy')
        .mockResolvedValueOnce([
          { action: AuditAction.CREATE, _count: 50 },
          { action: AuditAction.UPDATE, _count: 50 },
        ])
        .mockResolvedValueOnce([
          { resource: AuditResource.CONTRATO, _count: 100 },
        ])
        .mockResolvedValueOnce([
          { status: 'SUCCESS', _count: 90 },
          { status: 'ERROR', _count: 10 },
        ])
        .mockResolvedValueOnce([
          { userId: 1, username: 'teste', _count: 50 },
        ])
        .mockResolvedValueOnce([
          { error: 'Erro teste', _count: 5 },
        ]);

      const stats = await service.getStats(startDate, endDate);

      expect(stats).toEqual({
        totalEvents: 100,
        periodStart: startDate,
        periodEnd: endDate,
        byAction: {
          [AuditAction.CREATE]: 50,
          [AuditAction.UPDATE]: 50,
        },
        byResource: {
          [AuditResource.CONTRATO]: 100,
        },
        byStatus: {
          success: 90,
          error: 10,
        },
        topUsers: [
          {
            userId: 1,
            username: 'teste',
            count: 50,
          },
        ],
        topErrors: [
          {
            error: 'Erro teste',
            count: 5,
          },
        ],
      });
    });
  });

  describe('cleanup', () => {
    it('deve limpar registros antigos', async () => {
      const mockDate = new Date();
      jest.useFakeTimers().setSystemTime(mockDate);

      await service.cleanup();

      const cutoffDate = new Date(mockDate);
      cutoffDate.setDate(cutoffDate.getDate() - mockConfig.retention.days);

      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });
    });
  });
});
