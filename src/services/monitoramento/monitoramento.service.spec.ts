import { Test, TestingModule } from '@nestjs/testing';
import { MonitoramentoService } from './monitoramento.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ProcessadorAlertas } from './alertas/processador.alertas';
import { SistemaCollector } from './coletores/sistema.collector';
import { AplicacaoCollector } from './coletores/aplicacao.collector';
import { NotificacoesService } from '../notificacoes.service';
import { CacheService } from '../cache.service';
import { TipoAlerta, SeveridadeAlerta } from '../../domain/monitoramento/monitoramento.types';

describe('MonitoramentoService', () => {
  let service: MonitoramentoService;
  let prisma: PrismaService;
  let processadorAlertas: ProcessadorAlertas;
  let sistemaCollector: SistemaCollector;
  let aplicacaoCollector: AplicacaoCollector;

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
      providers: [
        MonitoramentoService,
        {
          provide: PrismaService,
          useValue: {
            metrica: {
              findMany: jest.fn().mockResolvedValue([mockMetrica]),
              findFirst: jest.fn().mockResolvedValue(mockMetrica),
              count: jest.fn().mockResolvedValue(1)
            },
            regraAlerta: {
              findMany: jest.fn().mockResolvedValue([mockRegra]),
              create: jest.fn().mockResolvedValue(mockRegra),
              update: jest.fn().mockResolvedValue(mockRegra),
              delete: jest.fn().mockResolvedValue(mockRegra),
              findFirst: jest.fn().mockResolvedValue(null)
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

    service = module.get<MonitoramentoService>(MonitoramentoService);
    prisma = module.get<PrismaService>(PrismaService);
    processadorAlertas = module.get<ProcessadorAlertas>(ProcessadorAlertas);
    sistemaCollector = module.get<SistemaCollector>(SistemaCollector);
    aplicacaoCollector = module.get<AplicacaoCollector>(AplicacaoCollector);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Coleta de Métricas', () => {
    it('should collect metrics', async () => {
      await service.coletarMetricas();
      expect(sistemaCollector.coletar).toHaveBeenCalled();
      expect(aplicacaoCollector.coletar).toHaveBeenCalled();
    });

    it('should handle collection errors', async () => {
      jest.spyOn(sistemaCollector, 'coletar').mockRejectedValue(new Error());
      await expect(service.coletarMetricas()).resolves.not.toThrow();
    });
  });

  describe('Processamento de Alertas', () => {
    it('should process alerts', async () => {
      await service.processarAlertas();
      expect(processadorAlertas.processarRegras).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      jest.spyOn(processadorAlertas, 'processarRegras').mockRejectedValue(new Error());
      await expect(service.processarAlertas()).resolves.not.toThrow();
    });
  });

  describe('Métricas', () => {
    it('should list metrics with filters', async () => {
      const query = {
        nome: 'test',
        inicio: new Date(),
        fim: new Date(),
        tag: 'test',
        limite: 10
      };

      const result = await service.listarMetricas(query);
      expect(result).toEqual([mockMetrica]);
      expect(prisma.metrica.findMany).toHaveBeenCalled();
    });

    it('should get metric history', async () => {
      const inicio = new Date();
      const fim = new Date();

      const result = await service.historicoMetrica('test_metric', inicio, fim);
      expect(result).toEqual([mockMetrica]);
      expect(prisma.metrica.findMany).toHaveBeenCalled();
    });
  });

  describe('Regras de Alerta', () => {
    it('should create alert rule', async () => {
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

      const result = await service.criarRegra(dto);
      expect(result).toEqual(mockRegra);
      expect(prisma.regraAlerta.create).toHaveBeenCalledWith({
        data: { ...dto, ativo: true }
      });
    });

    it('should update alert rule', async () => {
      const dto = {
        nome: 'updated_rule'
      };

      const result = await service.atualizarRegra('1', dto);
      expect(result).toEqual(mockRegra);
      expect(prisma.regraAlerta.update).toHaveBeenCalled();
    });
  });

  describe('Alertas', () => {
    it('should list alerts with filters', async () => {
      const query = {
        regraId: '1',
        severidade: SeveridadeAlerta.WARNING,
        inicio: new Date(),
        fim: new Date(),
        limite: 10
      };

      const result = await service.listarAlertas(query);
      expect(result).toEqual([mockAlerta]);
      expect(prisma.alerta.findMany).toHaveBeenCalled();
    });

    it('should resolve alert', async () => {
      const result = await service.resolverAlerta('1', 'Test observation');
      expect(result).toEqual(mockAlerta);
      expect(prisma.alerta.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'RESOLVIDO',
          resolvidoEm: expect.any(Date),
          observacao: 'Test observation'
        }
      });
    });
  });

  describe('Dashboard', () => {
    it('should get dashboard summary', async () => {
      const result = await service.getDashboardResumo();
      expect(result).toEqual({
        totalMetricas: 1,
        totalRegras: 1,
        alertasAtivos: 1,
        alertasUltimas24h: 1
      });
    });

    it('should get key metrics', async () => {
      const result = await service.getMetricasChave();
      expect(result).toBeDefined();
      expect(prisma.metrica.findFirst).toHaveBeenCalled();
    });

    it('should get recent alerts', async () => {
      const result = await service.getAlertasRecentes(5);
      expect(result).toEqual([mockAlerta]);
      expect(prisma.alerta.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { criadoEm: 'desc' },
        include: { regra: true }
      });
    });
  });
});
