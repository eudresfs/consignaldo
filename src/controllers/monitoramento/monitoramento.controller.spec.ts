import { Test, TestingModule } from '@nestjs/testing';
import { MonitoramentoController } from './monitoramento.controller';
import { MonitoramentoService } from '../../services/monitoramento/monitoramento.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ProcessadorAlertas } from '../../services/monitoramento/alertas/processador.alertas';
import { SistemaCollector } from '../../services/monitoramento/coletores/sistema.collector';
import { AplicacaoCollector } from '../../services/monitoramento/coletores/aplicacao.collector';
import { NotificacoesService } from '../../services/notificacoes.service';
import { CacheService } from '../../services/cache.service';
import { TipoAlerta, SeveridadeAlerta } from '../../domain/monitoramento/monitoramento.types';

describe('MonitoramentoController', () => {
  let controller: MonitoramentoController;
  let service: MonitoramentoService;

  const mockMetrica = {
    id: '1',
    nome: 'test_metric',
    valor: 42,
    criadoEm: new Date()
  };

  const mockRegra = {
    id: '1',
    nome: 'test_rule',
    tipo: TipoAlerta.THRESHOLD,
    severidade: SeveridadeAlerta.WARNING,
    condicao: '> 40'
  };

  const mockAlerta = {
    id: '1',
    regraId: '1',
    valor: 42,
    mensagem: 'Test alert',
    criadoEm: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoramentoController],
      providers: [
        MonitoramentoService,
        {
          provide: PrismaService,
          useValue: {
            metrica: {
              findMany: jest.fn().mockResolvedValue([mockMetrica]),
              findFirst: jest.fn().mockResolvedValue(mockMetrica)
            },
            regraAlerta: {
              findMany: jest.fn().mockResolvedValue([mockRegra]),
              create: jest.fn().mockResolvedValue(mockRegra),
              update: jest.fn().mockResolvedValue(mockRegra),
              delete: jest.fn().mockResolvedValue(mockRegra)
            },
            alerta: {
              findMany: jest.fn().mockResolvedValue([mockAlerta]),
              findUnique: jest.fn().mockResolvedValue(mockAlerta),
              update: jest.fn().mockResolvedValue(mockAlerta),
              count: jest.fn().mockResolvedValue(1)
            }
          }
        },
        {
          provide: ProcessadorAlertas,
          useValue: {
            processarRegras: jest.fn()
          }
        },
        {
          provide: SistemaCollector,
          useValue: {
            coletar: jest.fn()
          }
        },
        {
          provide: AplicacaoCollector,
          useValue: {
            coletar: jest.fn()
          }
        },
        {
          provide: NotificacoesService,
          useValue: {
            enviar: jest.fn()
          }
        },
        {
          provide: CacheService,
          useValue: {
            getStats: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<MonitoramentoController>(MonitoramentoController);
    service = module.get<MonitoramentoService>(MonitoramentoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Métricas', () => {
    it('should list metrics', async () => {
      const result = await controller.listarMetricas({});
      expect(result).toEqual([mockMetrica]);
    });

    it('should get metric by name', async () => {
      const result = await controller.buscarMetrica('test_metric');
      expect(result).toEqual(mockMetrica);
    });

    it('should get metric history', async () => {
      const inicio = new Date();
      const fim = new Date();
      const result = await controller.historicoMetrica('test_metric', inicio, fim);
      expect(result).toEqual([mockMetrica]);
    });
  });

  describe('Regras de Alerta', () => {
    it('should list rules', async () => {
      const result = await controller.listarRegras();
      expect(result).toEqual([mockRegra]);
    });

    it('should create rule', async () => {
      const dto = {
        nome: 'test_rule',
        descricao: 'Test rule',
        tipo: TipoAlerta.THRESHOLD,
        metricaNome: 'test_metric',
        severidade: SeveridadeAlerta.WARNING,
        condicao: '> 40',
        intervalo: 300,
        notificar: ['ADMIN']
      };

      const result = await controller.criarRegra(dto);
      expect(result).toEqual(mockRegra);
    });

    it('should update rule', async () => {
      const dto = {
        nome: 'updated_rule'
      };

      const result = await controller.atualizarRegra('1', dto);
      expect(result).toEqual(mockRegra);
    });
  });

  describe('Alertas', () => {
    it('should list alerts', async () => {
      const result = await controller.listarAlertas({});
      expect(result).toEqual([mockAlerta]);
    });

    it('should get alert by id', async () => {
      const result = await controller.buscarAlerta('1');
      expect(result).toEqual(mockAlerta);
    });

    it('should resolve alert', async () => {
      const result = await controller.resolverAlerta('1', 'Test observation');
      expect(result).toEqual(mockAlerta);
    });
  });

  describe('Dashboard', () => {
    it('should get dashboard summary', async () => {
      const result = await controller.dashboardResumo();
      expect(result).toBeDefined();
    });

    it('should get key metrics', async () => {
      const result = await controller.metricasChave();
      expect(result).toBeDefined();
    });

    it('should get recent alerts', async () => {
      const result = await controller.alertasRecentes(5);
      expect(result).toEqual([mockAlerta]);
    });
  });
});
