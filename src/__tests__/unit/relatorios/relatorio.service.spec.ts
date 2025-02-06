import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { RelatorioService } from '../../../services/relatorio.service';
import { RelatorioRepository } from '../../../repositories/relatorio.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { TipoRelatorio, FormatoRelatorio, StatusRelatorio } from '../../../domain/relatorios/relatorio.types';
import { Queue } from 'bull';

describe('RelatorioService', () => {
  let service: RelatorioService;
  let repository: RelatorioRepository;
  let storageService: StorageService;
  let queue: Queue;

  const mockRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarPorFiltros: jest.fn(),
    contarPorFiltros: jest.fn(),
    atualizarStatus: jest.fn(),
    atualizarUrlDownload: jest.fn(),
    registrarErro: jest.fn(),
    obterEstatisticas: jest.fn(),
  };

  const mockStorageService = {
    salvarArquivo: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatorioService,
        {
          provide: RelatorioRepository,
          useValue: mockRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: getQueueToken('relatorios'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<RelatorioService>(RelatorioService);
    repository = module.get<RelatorioRepository>(RelatorioRepository);
    storageService = module.get<StorageService>(StorageService);
    queue = module.get<Queue>(getQueueToken('relatorios'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarRelatorio', () => {
    const mockDto = {
      tipo: TipoRelatorio.CONTRATOS,
      formato: FormatoRelatorio.PDF,
      dataInicial: '2025-01-01',
      dataFinal: '2025-01-31',
    };

    const mockUsuarioId = 1;

    const mockRelatorio = {
      id: 'relatorio-1',
      tipo: TipoRelatorio.CONTRATOS,
      formato: FormatoRelatorio.PDF,
      status: StatusRelatorio.PENDENTE,
    };

    it('deve criar um relatório e enfileirar para processamento', async () => {
      mockRepository.criar.mockResolvedValue(mockRelatorio);
      mockQueue.add.mockResolvedValue(undefined);

      const result = await service.gerarRelatorio(mockDto, mockUsuarioId);

      expect(repository.criar).toHaveBeenCalledWith({
        tipo: mockDto.tipo,
        formato: mockDto.formato,
        filtros: {
          dataInicial: new Date(mockDto.dataInicial),
          dataFinal: new Date(mockDto.dataFinal),
        },
        usuarioId: mockUsuarioId,
      });

      expect(queue.add).toHaveBeenCalledWith(
        'gerar-relatorio',
        {
          relatorioId: mockRelatorio.id,
          tipo: mockDto.tipo,
          formato: mockDto.formato,
          filtros: {
            dataInicial: new Date(mockDto.dataInicial),
            dataFinal: new Date(mockDto.dataFinal),
          },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      expect(result).toEqual(mockRelatorio);
    });

    it('deve lançar erro se falhar ao criar relatório', async () => {
      const error = new Error('Erro ao criar relatório');
      mockRepository.criar.mockRejectedValue(error);

      await expect(service.gerarRelatorio(mockDto, mockUsuarioId)).rejects.toThrow(error);
    });
  });

  describe('consultarStatus', () => {
    const mockRelatorioId = 'relatorio-1';
    const mockRelatorio = {
      id: mockRelatorioId,
      status: StatusRelatorio.PROCESSANDO,
    };

    it('deve retornar o status do relatório', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockRelatorio);

      const result = await service.consultarStatus(mockRelatorioId);

      expect(repository.buscarPorId).toHaveBeenCalledWith(mockRelatorioId);
      expect(result).toEqual(mockRelatorio);
    });

    it('deve lançar erro se relatório não for encontrado', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.consultarStatus(mockRelatorioId)).rejects.toThrow(
        `Relatório ${mockRelatorioId} não encontrado`,
      );
    });
  });

  describe('listarRelatorios', () => {
    const mockFiltros = {
      tipo: TipoRelatorio.CONTRATOS,
      status: StatusRelatorio.CONCLUIDO,
      dataInicial: '2025-01-01',
      dataFinal: '2025-01-31',
    };

    const mockRelatorios = [
      { id: 'relatorio-1', tipo: TipoRelatorio.CONTRATOS },
      { id: 'relatorio-2', tipo: TipoRelatorio.CONTRATOS },
    ];

    it('deve retornar lista de relatórios com total', async () => {
      mockRepository.listarPorFiltros.mockResolvedValue(mockRelatorios);
      mockRepository.contarPorFiltros.mockResolvedValue(2);

      const result = await service.listarRelatorios(mockFiltros);

      expect(repository.listarPorFiltros).toHaveBeenCalledWith({
        tipo: mockFiltros.tipo,
        status: mockFiltros.status,
        dataInicial: new Date(mockFiltros.dataInicial),
        dataFinal: new Date(mockFiltros.dataFinal),
      });

      expect(result).toEqual({
        relatorios: mockRelatorios,
        total: 2,
        filtros: mockFiltros,
      });
    });
  });

  describe('processarRelatorio', () => {
    const mockRelatorioId = 'relatorio-1';
    const mockRelatorio = {
      id: mockRelatorioId,
      tipo: TipoRelatorio.CONTRATOS,
      formato: FormatoRelatorio.PDF,
      filtros: {},
    };

    it('deve processar relatório com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockRelatorio);
      mockStorageService.salvarArquivo.mockResolvedValue('url-do-arquivo');

      await service.processarRelatorio(mockRelatorioId);

      expect(repository.atualizarStatus).toHaveBeenCalledWith(
        mockRelatorioId,
        StatusRelatorio.PROCESSANDO,
      );

      expect(repository.atualizarUrlDownload).toHaveBeenCalledWith(
        mockRelatorioId,
        'url-do-arquivo',
      );
    });

    it('deve registrar erro se processamento falhar', async () => {
      const error = new Error('Erro ao processar relatório');
      mockRepository.buscarPorId.mockResolvedValue(mockRelatorio);
      mockStorageService.salvarArquivo.mockRejectedValue(error);

      await expect(service.processarRelatorio(mockRelatorioId)).rejects.toThrow(error);

      expect(repository.registrarErro).toHaveBeenCalledWith(
        mockRelatorioId,
        error.message,
      );
    });
  });
});
