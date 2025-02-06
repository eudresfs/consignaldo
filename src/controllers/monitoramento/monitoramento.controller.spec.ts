import { Test, TestingModule } from '@nestjs/testing';
import { MonitoramentoController } from './monitoramento.controller';
import { NotificacoesService } from '../../services/notificacoes/notificacoes.service';
import { CacheService } from '../../services/cache/cache.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('MonitoramentoController', () => {
  let controller: MonitoramentoController;
  let notificacoesService: DeepMockProxy<NotificacoesService>;
  let cacheService: DeepMockProxy<CacheService>;

  const mockDate = new Date('2025-02-06T16:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoramentoController],
      providers: [
        {
          provide: NotificacoesService,
          useValue: mockDeep<NotificacoesService>()
        },
        {
          provide: CacheService,
          useValue: mockDeep<CacheService>()
        }
      ]
    }).compile();

    controller = module.get<MonitoramentoController>(MonitoramentoController);
    notificacoesService = module.get(NotificacoesService) as DeepMockProxy<NotificacoesService>;
    cacheService = module.get(CacheService) as DeepMockProxy<CacheService>;

    // Mock Date.now()
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    const mockStatus = {
      uptime: 3600,
      memoryUsage: {
        heapTotal: 100000000,
        heapUsed: 50000000,
        external: 10000000,
        rss: 200000000
      },
      notificacoes: {
        total: 1000,
        pendentes: 100,
        enviadas: 800,
        erros: 100
      },
      cache: {
        hits: 5000,
        misses: 1000,
        keys: 500,
        size: 1000000
      }
    };

    it('should return system status', async () => {
      notificacoesService.getEstatisticas.mockResolvedValue({
        total: 1000,
        enviadas: 800,
        erros: 100,
        taxaSucesso: 80,
        tempoMedioEnvio: 1.5,
        porTipo: {
          EMAIL: 500,
          SMS: 500
        },
        porStatus: {
          ENVIADO: 800,
          ERRO: 100,
          PENDENTE: 100
        }
      });

      cacheService.getMetrics.mockResolvedValue({
        hits: 5000,
        misses: 1000,
        keys: 500,
        size: 1000000
      });

      const result = await controller.getStatus();

      expect(result).toEqual(mockStatus);
    });
  });

  describe('getMetrics', () => {
    const mockMetrics = {
      notificacoes: {
        total: 1000,
        porTipo: {
          EMAIL: 500,
          SMS: 500
        },
        porStatus: {
          ENVIADO: 800,
          ERRO: 100,
          PENDENTE: 100
        },
        taxaSucesso: 80,
        tempoMedioEnvio: 1.5
      },
      cache: {
        hitRate: 0.83,
        missRate: 0.17,
        size: 1000000,
        evictions: 100
      },
      sistema: {
        cpu: 45.5,
        memoria: 75.2,
        disco: 60.8
      }
    };

    it('should return system metrics', async () => {
      notificacoesService.getEstatisticas.mockResolvedValue({
        total: 1000,
        enviadas: 800,
        erros: 100,
        taxaSucesso: 80,
        tempoMedioEnvio: 1.5,
        porTipo: {
          EMAIL: 500,
          SMS: 500
        },
        porStatus: {
          ENVIADO: 800,
          ERRO: 100,
          PENDENTE: 100
        }
      });

      cacheService.getMetrics.mockResolvedValue({
        hits: 5000,
        misses: 1000,
        keys: 500,
        size: 1000000,
        evictions: 100
      });

      const result = await controller.getMetrics();

      expect(result).toEqual(mockMetrics);
    });
  });
});
