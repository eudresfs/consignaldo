import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IntegrationService } from '../../services/integration.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { IntegrationType } from '../../domain/enums/integration-type.enum';
import { of, throwError } from 'rxjs';
import { IntegrationError } from '../../domain/errors/integration.error';

describe('IntegrationService', () => {
  let service: IntegrationService;
  let httpService: HttpService;
  let prisma: PrismaService;
  let cache: CacheService;

  const mockConfig = {
    id: 1,
    nome: 'Test Integration',
    tipo: IntegrationType.MARGEM,
    url: 'https://api.test.com',
    token: 'test-token',
    ativo: true,
    consignanteId: 1,
    timeoutMs: 5000,
    retries: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationService,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            integrationConfig: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            generateKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IntegrationService>(IntegrationService);
    httpService = module.get<HttpService>(HttpService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
  });

  describe('consultarMargem', () => {
    const mockMargemData = {
      matricula: '123456',
      margemDisponivel: 1000,
      margemUtilizada: 500,
      margemTotal: 1500,
      contratos: [],
    };

    it('deve retornar dados do cache se disponível', async () => {
      const cachedResult = {
        success: true,
        data: mockMargemData,
        timestamp: new Date(),
        duration: 100,
      };

      jest.spyOn(cache, 'generateKey').mockReturnValue('test-key');
      jest.spyOn(cache, 'get').mockResolvedValue(cachedResult);

      const result = await service.consultarMargem(1, '123456');

      expect(result).toEqual(cachedResult);
      expect(httpService.request).not.toHaveBeenCalled();
    });

    it('deve consultar API e cachear resultado se cache vazio', async () => {
      jest.spyOn(cache, 'generateKey').mockReturnValue('test-key');
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
      jest.spyOn(httpService, 'request').mockReturnValue(
        of({
          data: mockMargemData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        })
      );

      const result = await service.consultarMargem(1, '123456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMargemData);
      expect(cache.set).toHaveBeenCalled();
    });

    it('deve lidar com erros da API e cachear por menos tempo', async () => {
      jest.spyOn(cache, 'generateKey').mockReturnValue('test-key');
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
      jest.spyOn(httpService, 'request').mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      const result = await service.consultarMargem(1, '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(cache.set).toHaveBeenCalledWith(
        'test-key',
        expect.any(Object),
        60
      );
    });
  });

  describe('averbarContrato', () => {
    const mockAverbacaoData = {
      matricula: '123456',
      contrato: 'CONT123',
      parcela: 100,
      prazo: 48,
      dataInicio: new Date(),
      banco: 'BANCO TEST',
      situacao: 'PENDENTE',
    };

    it('deve averbar contrato com sucesso', async () => {
      jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
      jest.spyOn(httpService, 'request').mockReturnValue(
        of({
          data: mockAverbacaoData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        })
      );

      const result = await service.averbarContrato(1, mockAverbacaoData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAverbacaoData);
    });

    it('deve lançar IntegrationError em caso de falha', async () => {
      jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
      jest.spyOn(httpService, 'request').mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      await expect(service.averbarContrato(1, mockAverbacaoData))
        .rejects
        .toThrow(IntegrationError);
    });
  });
});
