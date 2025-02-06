import { Test, TestingModule } from '@nestjs/testing';
import { RelatoriosService } from '../../../services/relatorios/relatorios.service';
import { RelatoriosRepository } from '../../../repositories/relatorios.repository';
import { AuditoriaService } from '../../../services/auditoria.service';
import { StorageService } from '../../../services/storage.service';
import { CacheService } from '../../../services/cache.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TipoRelatorio, FormatoRelatorio, StatusRelatorio } from '../../../domain/relatorios/relatorios.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let repository: RelatoriosRepository;
  let auditoria: AuditoriaService;
  let storage: StorageService;
  let cache: CacheService;

  const mockRepository = {
    criarTemplate: jest.fn(),
    atualizarTemplate: jest.fn(),
    buscarTemplatePorId: jest.fn(),
    listarTemplates: jest.fn(),
    criarRelatorio: jest.fn(),
    atualizarStatusRelatorio: jest.fn(),
    buscarRelatorioPorId: jest.fn(),
    listarRelatorios: jest.fn(),
    removerRelatorio: jest.fn()
  };

  const mockAuditoria = {
    registrar: jest.fn()
  };

  const mockStorage = {
    upload: jest.fn(),
    remover: jest.fn()
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        {
          provide: RelatoriosRepository,
          useValue: mockRepository
        },
        {
          provide: AuditoriaService,
          useValue: mockAuditoria
        },
        {
          provide: StorageService,
          useValue: mockStorage
        },
        {
          provide: CacheService,
          useValue: mockCache
        },
        {
          provide: PrismaService,
          useValue: {}
        }
      ]
    }).compile();

    service = module.get<RelatoriosService>(RelatoriosService);
    repository = module.get<RelatoriosRepository>(RelatoriosRepository);
    auditoria = module.get<AuditoriaService>(AuditoriaService);
    storage = module.get<StorageService>(StorageService);
    cache = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criarTemplate', () => {
    const mockDto = {
      nome: 'Template Teste',
      tipo: TipoRelatorio.CONTRATOS,
      formato: FormatoRelatorio.PDF,
      layout: 'layout teste'
    };

    it('deve criar template com sucesso', async () => {
      const mockTemplate = { id: '1', ...mockDto };
      mockRepository.criarTemplate.mockResolvedValue(mockTemplate);

      const result = await service.criarTemplate(mockDto, 1);

      expect(result).toBe(mockTemplate);
      expect(mockRepository.criarTemplate).toHaveBeenCalledWith(mockDto);
      expect(mockAuditoria.registrar).toHaveBeenCalled();
    });
  });

  describe('gerarRelatorio', () => {
    const mockTemplate = {
      id: '1',
      tipo: TipoRelatorio.CONTRATOS,
      formato: FormatoRelatorio.PDF
    };

    const mockDto = {
      templateId: '1',
      formato: FormatoRelatorio.PDF
    };

    it('deve iniciar geração de relatório com sucesso', async () => {
      mockRepository.buscarTemplatePorId.mockResolvedValue(mockTemplate);
      mockRepository.criarRelatorio.mockResolvedValue({
        id: '1',
        status: StatusRelatorio.AGUARDANDO
      });

      const result = await service.gerarRelatorio(mockDto, 1);

      expect(result.status).toBe(StatusRelatorio.AGUARDANDO);
      expect(mockRepository.criarRelatorio).toHaveBeenCalled();
    });

    it('deve rejeitar template inexistente', async () => {
      mockRepository.buscarTemplatePorId.mockResolvedValue(null);

      await expect(service.gerarRelatorio(mockDto, 1))
        .rejects
        .toThrow(NotFoundException);
    });

    it('deve usar cache quando disponível', async () => {
      mockRepository.buscarTemplatePorId.mockResolvedValue(mockTemplate);
      mockRepository.criarRelatorio.mockResolvedValue({
        id: '1',
        status: StatusRelatorio.AGUARDANDO
      });
      mockCache.get.mockResolvedValue('cached-url');

      await service.gerarRelatorio(mockDto, 1);

      expect(mockCache.get).toHaveBeenCalled();
    });
  });

  describe('buscarRelatorio', () => {
    it('deve retornar relatório existente', async () => {
      const mockRelatorio = {
        id: '1',
        status: StatusRelatorio.CONCLUIDO
      };
      mockRepository.buscarRelatorioPorId.mockResolvedValue(mockRelatorio);

      const result = await service.buscarRelatorio('1');

      expect(result).toBe(mockRelatorio);
    });

    it('deve rejeitar relatório inexistente', async () => {
      mockRepository.buscarRelatorioPorId.mockResolvedValue(null);

      await expect(service.buscarRelatorio('1'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('removerRelatorio', () => {
    it('deve remover relatório com sucesso', async () => {
      const mockRelatorio = {
        id: '1',
        arquivoUrl: 'test-url'
      };
      mockRepository.buscarRelatorioPorId.mockResolvedValue(mockRelatorio);

      await service.removerRelatorio('1', 1);

      expect(mockStorage.remover).toHaveBeenCalledWith('test-url');
      expect(mockRepository.removerRelatorio).toHaveBeenCalledWith('1');
      expect(mockAuditoria.registrar).toHaveBeenCalled();
    });

    it('deve rejeitar relatório inexistente', async () => {
      mockRepository.buscarRelatorioPorId.mockResolvedValue(null);

      await expect(service.removerRelatorio('1', 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
