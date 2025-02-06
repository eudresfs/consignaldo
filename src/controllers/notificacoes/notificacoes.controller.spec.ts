import { Test, TestingModule } from '@nestjs/testing';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from '../../services/notificacoes/notificacoes.service';
import { TipoNotificacao, StatusNotificacao, PrioridadeNotificacao } from '../../domain/notificacoes/notificacoes.types';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('NotificacoesController', () => {
  let controller: NotificacoesController;
  let service: DeepMockProxy<NotificacoesService>;

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('criarNotificacao', () => {
    const mockNotificacao = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      prioridade: PrioridadeNotificacao.MEDIA,
      destinatario: 'teste@teste.com',
      titulo: 'Teste',
      conteudo: 'Conteúdo teste',
      status: StatusNotificacao.PENDENTE
    };

    it('should create notification', async () => {
      service.criarNotificacao.mockResolvedValue(mockNotificacao);

      const result = await controller.criarNotificacao({
        tipo: TipoNotificacao.EMAIL,
        prioridade: PrioridadeNotificacao.MEDIA,
        destinatario: 'teste@teste.com',
        titulo: 'Teste',
        conteudo: 'Conteúdo teste'
      });

      expect(result).toEqual(mockNotificacao);
      expect(service.criarNotificacao).toHaveBeenCalled();
    });
  });

  describe('listarNotificacoes', () => {
    const mockNotificacoes = {
      total: 2,
      items: [
        {
          id: '1',
          tipo: TipoNotificacao.EMAIL,
          status: StatusNotificacao.ENVIADO
        },
        {
          id: '2',
          tipo: TipoNotificacao.SMS,
          status: StatusNotificacao.PENDENTE
        }
      ]
    };

    it('should list notifications with filters', async () => {
      service.listarNotificacoes.mockResolvedValue(mockNotificacoes);

      const result = await controller.listarNotificacoes({
        tipo: TipoNotificacao.EMAIL,
        inicio: new Date(),
        fim: new Date(),
        limite: 10,
        offset: 0
      });

      expect(result).toEqual(mockNotificacoes);
      expect(service.listarNotificacoes).toHaveBeenCalled();
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

      const result = await controller.getEstatisticas(
        new Date(),
        new Date()
      );

      expect(result).toEqual(mockStats);
      expect(service.getEstatisticas).toHaveBeenCalled();
    });
  });

  describe('reenviarNotificacao', () => {
    const mockNotificacao = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      status: StatusNotificacao.ERRO
    };

    it('should resend notification', async () => {
      service.reenviarNotificacao.mockResolvedValue(mockNotificacao);

      const result = await controller.reenviarNotificacao('1');

      expect(result).toEqual(mockNotificacao);
      expect(service.reenviarNotificacao).toHaveBeenCalledWith('1');
    });
  });

  describe('cancelarNotificacao', () => {
    const mockNotificacao = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      status: StatusNotificacao.CANCELADO
    };

    it('should cancel notification', async () => {
      service.cancelarNotificacao.mockResolvedValue(mockNotificacao);

      const result = await controller.cancelarNotificacao('1');

      expect(result).toEqual(mockNotificacao);
      expect(service.cancelarNotificacao).toHaveBeenCalledWith('1');
    });
  });

  describe('resolverNotificacao', () => {
    const mockNotificacao = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      status: StatusNotificacao.RESOLVIDO
    };

    it('should resolve notification', async () => {
      service.resolverNotificacao.mockResolvedValue(mockNotificacao);

      const result = await controller.resolverNotificacao('1', {
        observacao: 'Problema resolvido'
      });

      expect(result).toEqual(mockNotificacao);
      expect(service.resolverNotificacao).toHaveBeenCalledWith(
        '1',
        'Problema resolvido'
      );
    });
  });
});
