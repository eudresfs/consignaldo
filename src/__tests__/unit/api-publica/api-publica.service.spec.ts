import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ApiPublicaService } from '../../../services/api-publica.service';
import { ApiPublicaRepository } from '../../../repositories/api-publica.repository';
import { AuditoriaService } from '../../../services/auditoria.service';
import { StatusIntegracao } from '../../../domain/api-publica/api-publica.types';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('ApiPublicaService', () => {
  let service: ApiPublicaService;
  let repository: ApiPublicaRepository;
  let auditoriaService: AuditoriaService;
  let configService: ConfigService;

  const mockRepository = {
    criarApiKey: jest.fn(),
    buscarApiKeyPorId: jest.fn(),
    buscarApiKeyPorChave: jest.fn(),
    atualizarApiKey: jest.fn(),
    listarApiKeys: jest.fn(),
    criarWebhook: jest.fn(),
    atualizarWebhook: jest.fn(),
    removerWebhook: jest.fn(),
    registrarLog: jest.fn(),
    buscarLogs: jest.fn(),
    obterMetricas: jest.fn()
  };

  const mockAuditoriaService = {
    registrar: jest.fn()
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret')
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiPublicaService,
        {
          provide: ApiPublicaRepository,
          useValue: mockRepository
        },
        {
          provide: AuditoriaService,
          useValue: mockAuditoriaService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<ApiPublicaService>(ApiPublicaService);
    repository = module.get<ApiPublicaRepository>(ApiPublicaRepository);
    auditoriaService = module.get<AuditoriaService>(AuditoriaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criarApiKey', () => {
    const mockDto = {
      nome: 'Test API Key',
      clienteId: '123',
      permissoes: ['READ', 'WRITE'],
      limitesUso: {
        requisicoesPorMinuto: 60,
        requisicoesPorHora: 1000,
        requisicoesPorDia: 10000,
        requisicoesConcorrentes: 5
      }
    };

    it('deve criar uma API Key com sucesso', async () => {
      const mockApiKey = {
        id: '1',
        chave: 'test-key',
        ...mockDto,
        status: StatusIntegracao.ATIVO,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      mockRepository.criarApiKey.mockResolvedValue(mockApiKey);

      const result = await service.criarApiKey(mockDto, 1);

      expect(result).toBeDefined();
      expect(result.chave).toBeDefined();
      expect(mockRepository.criarApiKey).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });
  });

  describe('validarApiKey', () => {
    it('deve validar uma API Key ativa com sucesso', async () => {
      const mockApiKey = {
        id: '1',
        chave: 'valid-key',
        status: StatusIntegracao.ATIVO
      };

      mockRepository.buscarApiKeyPorChave.mockResolvedValue(mockApiKey);

      const result = await service.validarApiKey('valid-key');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('deve rejeitar uma API Key inválida', async () => {
      mockRepository.buscarApiKeyPorChave.mockResolvedValue(null);

      await expect(service.validarApiKey('invalid-key')).rejects.toThrow(UnauthorizedException);
    });

    it('deve rejeitar uma API Key inativa', async () => {
      const mockApiKey = {
        id: '1',
        chave: 'inactive-key',
        status: StatusIntegracao.INATIVO
      };

      mockRepository.buscarApiKeyPorChave.mockResolvedValue(mockApiKey);

      await expect(service.validarApiKey('inactive-key')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('configurarWebhook', () => {
    const mockDto = {
      url: 'https://test.com/webhook',
      eventos: ['CONTRATO_CRIADO', 'CONTRATO_APROVADO'],
      ativo: true,
      tentativasMaximas: 3,
      intervalosRetentativa: [60, 300, 900]
    };

    it('deve configurar webhook com sucesso', async () => {
      mockRepository.buscarApiKeyPorId.mockResolvedValue({ id: '1' });
      mockRepository.criarWebhook.mockResolvedValue({
        id: '1',
        apiKeyId: '1',
        ...mockDto
      });

      const result = await service.configurarWebhook('1', mockDto, 1);

      expect(result).toBeDefined();
      expect(result.url).toBe(mockDto.url);
      expect(mockRepository.criarWebhook).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });

    it('deve rejeitar configuração para API Key inexistente', async () => {
      mockRepository.buscarApiKeyPorId.mockResolvedValue(null);

      await expect(service.configurarWebhook('1', mockDto, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('obterMetricas', () => {
    it('deve retornar métricas para período válido', async () => {
      const mockMetricas = {
        apiKeyId: '1',
        periodo: 'dia',
        requisicoes: 1000,
        erros: 10,
        tempoMedioResposta: 150,
        statusCodes: { 200: 990, 400: 10 }
      };

      mockRepository.obterMetricas.mockResolvedValue(mockMetricas);

      const result = await service.obterMetricas('1', 'dia');

      expect(result).toBeDefined();
      expect(result.requisicoes).toBe(1000);
      expect(mockRepository.obterMetricas).toHaveBeenCalledWith('1', 'dia');
    });

    it('deve rejeitar período inválido', async () => {
      await expect(service.obterMetricas('1', 'invalid')).rejects.toThrow(BadRequestException);
    });
  });
});
