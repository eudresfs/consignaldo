import { Test, TestingModule } from '@nestjs/testing';
import { NotificacoesService } from './notificacoes.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EmailProvider, SmsProvider, PushProvider, WhatsAppProvider, WebhookProvider } from './providers';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TipoNotificacao, StatusNotificacao, PrioridadeNotificacao } from '../../domain/notificacoes/notificacoes.types';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('NotificacoesService', () => {
  let service: NotificacoesService;
  let prisma: DeepMockProxy<PrismaService>;
  let emailProvider: DeepMockProxy<EmailProvider>;
  let smsProvider: DeepMockProxy<SmsProvider>;
  let pushProvider: DeepMockProxy<PushProvider>;
  let whatsappProvider: DeepMockProxy<WhatsAppProvider>;
  let webhookProvider: DeepMockProxy<WebhookProvider>;

  const mockDate = new Date('2025-02-06T16:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacoesService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>()
        },
        {
          provide: CacheService,
          useValue: mockDeep<CacheService>()
        },
        {
          provide: EmailProvider,
          useValue: mockDeep<EmailProvider>()
        },
        {
          provide: SmsProvider,
          useValue: mockDeep<SmsProvider>()
        },
        {
          provide: PushProvider,
          useValue: mockDeep<PushProvider>()
        },
        {
          provide: WhatsAppProvider,
          useValue: mockDeep<WhatsAppProvider>()
        },
        {
          provide: WebhookProvider,
          useValue: mockDeep<WebhookProvider>()
        },
        {
          provide: ConfigService,
          useValue: mockDeep<ConfigService>()
        }
      ]
    }).compile();

    service = module.get<NotificacoesService>(NotificacoesService);
    prisma = module.get(PrismaService) as DeepMockProxy<PrismaService>;
    emailProvider = module.get(EmailProvider) as DeepMockProxy<EmailProvider>;
    smsProvider = module.get(SmsProvider) as DeepMockProxy<SmsProvider>;
    pushProvider = module.get(PushProvider) as DeepMockProxy<PushProvider>;
    whatsappProvider = module.get(WhatsAppProvider) as DeepMockProxy<WhatsAppProvider>;
    webhookProvider = module.get(WebhookProvider) as DeepMockProxy<WebhookProvider>;

    // Mock Date.now()
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

    it('should create notification with template', async () => {
      prisma.templateNotificacao.findUnique.mockResolvedValue(mockTemplate);
      prisma.notificacao.create.mockResolvedValue(mockNotificacao);

      const result = await service.criarNotificacao({
        tipo: TipoNotificacao.EMAIL,
        prioridade: PrioridadeNotificacao.MEDIA,
        destinatario: 'teste@teste.com',
        titulo: 'Teste',
        conteudo: 'Conteúdo teste',
        templateId: '1'
      });

      expect(result).toEqual(mockNotificacao);
      expect(prisma.notificacao.create).toHaveBeenCalled();
    });

    it('should throw if template not found', async () => {
      prisma.templateNotificacao.findUnique.mockResolvedValue(null);

      await expect(
        service.criarNotificacao({
          tipo: TipoNotificacao.EMAIL,
          prioridade: PrioridadeNotificacao.MEDIA,
          destinatario: 'teste@teste.com',
          titulo: 'Teste',
          conteudo: 'Conteúdo teste',
          templateId: '1'
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if template type does not match notification type', async () => {
      prisma.templateNotificacao.findUnique.mockResolvedValue({
        ...mockTemplate,
        tipo: TipoNotificacao.SMS
      });

      await expect(
        service.criarNotificacao({
          tipo: TipoNotificacao.EMAIL,
          prioridade: PrioridadeNotificacao.MEDIA,
          destinatario: 'teste@teste.com',
          titulo: 'Teste',
          conteudo: 'Conteúdo teste',
          templateId: '1'
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processarNotificacao', () => {
    const mockNotificacao = {
      id: '1',
      tipo: TipoNotificacao.EMAIL,
      prioridade: PrioridadeNotificacao.MEDIA,
      destinatario: 'teste@teste.com',
      titulo: 'Teste',
      conteudo: 'Conteúdo teste',
      status: StatusNotificacao.PENDENTE,
      tentativas: 0,
      criadoEm: mockDate,
      atualizadoEm: mockDate
    };

    it('should process email notification successfully', async () => {
      emailProvider.enviar.mockResolvedValue(undefined);
      prisma.notificacao.update.mockResolvedValue({
        ...mockNotificacao,
        status: StatusNotificacao.ENVIADO
      });

      await service['processarNotificacao'](mockNotificacao);

      expect(emailProvider.enviar).toHaveBeenCalledWith(mockNotificacao);
      expect(prisma.notificacao.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: StatusNotificacao.ENVIADO
        })
      });
    });

    it('should handle provider error', async () => {
      const erro = new Error('Erro ao enviar');
      emailProvider.enviar.mockRejectedValue(erro);

      await expect(
        service['processarNotificacao'](mockNotificacao)
      ).rejects.toThrow(erro);

      expect(prisma.notificacao.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: StatusNotificacao.ERRO,
          erro: erro.message
        })
      });
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
      prisma.notificacao.count.mockResolvedValue(2);
      prisma.notificacao.findMany.mockResolvedValue(mockNotificacoes);

      const result = await service.listarNotificacoes(
        TipoNotificacao.EMAIL,
        new Date(),
        new Date(),
        10,
        0
      );

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
      porTipo: [
        { tipo: TipoNotificacao.EMAIL, _count: 50 },
        { tipo: TipoNotificacao.SMS, _count: 50 }
      ],
      porStatus: [
        { status: StatusNotificacao.ENVIADO, _count: 80 },
        { status: StatusNotificacao.ERRO, _count: 20 }
      ],
      _avg: { tentativas: 1.5 }
    };

    it('should return notification statistics', async () => {
      prisma.notificacao.count.mockResolvedValueOnce(mockStats.total);
      prisma.notificacao.count.mockResolvedValueOnce(mockStats.enviadas);
      prisma.notificacao.count.mockResolvedValueOnce(mockStats.erros);
      prisma.notificacao.groupBy.mockResolvedValueOnce(mockStats.porTipo);
      prisma.notificacao.groupBy.mockResolvedValueOnce(mockStats.porStatus);
      prisma.notificacao.aggregate.mockResolvedValue({ _avg: mockStats._avg });

      const result = await service.getEstatisticas();

      expect(result).toEqual({
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
      });
    });
  });
});
