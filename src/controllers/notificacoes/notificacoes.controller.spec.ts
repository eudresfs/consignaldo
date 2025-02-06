import { Test, TestingModule } from '@nestjs/testing';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from '../../services/notificacoes/notificacoes.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { TipoNotificacao, StatusNotificacao, PrioridadeNotificacao } from '../../domain/notificacoes/notificacoes.types';

describe('NotificacoesController', () => {
  let controller: NotificacoesController;
  let service: DeepMockProxy<NotificacoesService>;

  const mockDate = new Date('2025-02-06T16:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificacoesController],
      providers: [
        {
          provide: NotificacoesService,
          useValue: mockDeep<NotificacoesService>()
        }
      ]
    }).compile();

    controller = module.get<NotificacoesController>(NotificacoesController);
    service = module.get(NotificacoesService) as DeepMockProxy<NotificacoesService>;

    // Mock Date.now()
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('criarNotificacao', () => {
    const mockTemplate = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      nome: 'Template Teste',
      conteudo: 'Conteúdo teste',
      criadoEm: mockDate,
      atualizadoEm: mockDate
    };

    const mockNotificacao = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      prioridade: PrioridadeNotificacao.MEDIA,
      destinatario: 'teste@teste.com',
      titulo: 'Teste',
      conteudo: 'Conteúdo teste',
      status: StatusNotificacao.PENDENTE,
      template: mockTemplate,
      tentativas: 0,
      criadoEm: mockDate,
      atualizadoEm: mockDate
    };

    it('should create notification', async () => {
      service.criarNotificacao.mockResolvedValue(mockNotificacao);

      const result = await controller.criarNotificacao({
        tipo: TipoNotificacao.EMAIL,
        prioridade: PrioridadeNotificacao.MEDIA,
        destinatario: 'teste@teste.com',
        titulo: 'Teste',
        conteudo: 'Conteúdo teste',
        templateId: '1'
      });

      expect(result).toEqual(mockNotificacao);
      expect(service.criarNotificacao).toHaveBeenCalled();
    });
  });

  describe('listarNotificacoes', () => {
    const mockNotificacoes = [
      {
        id: '1',
        tipo: TipoNotificacao.EMAIL,
        status: StatusNotificacao.ENVIADO,
        criadoEm: mockDate,
        atualizadoEm: mockDate
      },
      {
        id: '2',
        tipo: TipoNotificacao.SMS,
        status: StatusNotificacao.PENDENTE,
        criadoEm: mockDate,
        atualizadoEm: mockDate
      }
    ];

    it('should list notifications with filters', async () => {
      service.listarNotificacoes.mockResolvedValue({
        total: 2,
        items: mockNotificacoes
      });

      const result = await controller.listarNotificacoes({
        tipo: TipoNotificacao.EMAIL,
        dataInicio: '2025-02-01',
        dataFim: '2025-02-06',
        limite: 10,
        pagina: 0
      });

      expect(result).toEqual({
        total: 2,
        items: mockNotificacoes
      });
    });
  });

  describe('getEstatisticas', () => {
    const mockStats = {
      total: 100,
      enviadas: 80,
      erros: 20,
      taxaSucesso: 80,
      tempoMedioEnvio: 1.5,
      porTipo: {
        EMAIL: 50,
        SMS: 50
      },
      porStatus: {
        ENVIADO: 80,
        ERRO: 20
      }
    };

    it('should return notification statistics', async () => {
      service.getEstatisticas.mockResolvedValue(mockStats);

      const result = await controller.getEstatisticas();

      expect(result).toEqual(mockStats);
    });
  });

  describe('reprocessarNotificacao', () => {
    const mockNotificacao = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      prioridade: PrioridadeNotificacao.MEDIA,
      destinatario: 'teste@teste.com',
      titulo: 'Teste',
      conteudo: 'Conteúdo teste',
      status: StatusNotificacao.ENVIADO,
      tentativas: 1,
      criadoEm: mockDate,
      atualizadoEm: mockDate
    };

    it('should reprocess notification', async () => {
      service.reprocessarNotificacao.mockResolvedValue(mockNotificacao);

      const result = await controller.reprocessarNotificacao('1');

      expect(result).toEqual(mockNotificacao);
      expect(service.reprocessarNotificacao).toHaveBeenCalledWith('1');
    });
  });
});
