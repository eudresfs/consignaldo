import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DocumentoService } from '../../../services/documento.service';
import { DocumentoRepository } from '../../../repositories/documento.repository';
import { StorageService } from '../../../services/storage/storage.service';
import { AuditoriaService } from '../../../services/auditoria.service';
import { 
  TipoDocumento,
  StatusDocumento,
  TipoArmazenamento 
} from '../../../domain/documentos/documento.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DocumentoService', () => {
  let service: DocumentoService;
  let repository: DocumentoRepository;
  let storageService: StorageService;
  let auditoriaService: AuditoriaService;

  const mockDocumentoRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    listarPorFiltros: jest.fn(),
    contarPorFiltros: jest.fn(),
    atualizarStatus: jest.fn(),
    buscarDocumentosExpirados: jest.fn(),
    obterEstatisticas: jest.fn(),
  };

  const mockStorageService = {
    salvarArquivo: jest.fn(),
    excluirArquivo: jest.fn(),
    gerarUrlTemporaria: jest.fn(),
  };

  const mockAuditoriaService = {
    registrar: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(TipoArmazenamento.S3),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentoService,
        {
          provide: DocumentoRepository,
          useValue: mockDocumentoRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: AuditoriaService,
          useValue: mockAuditoriaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DocumentoService>(DocumentoService);
    repository = module.get<DocumentoRepository>(DocumentoRepository);
    storageService = module.get<StorageService>(StorageService);
    auditoriaService = module.get<AuditoriaService>(AuditoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    const mockArquivo = Buffer.from('test');
    const mockNomeArquivo = 'test.pdf';
    const mockMimeType = 'application/pdf';
    const mockDto = {
      tipo: TipoDocumento.CONTRATO,
      nome: 'Contrato',
      descricao: 'Contrato de teste',
    };
    const mockUsuarioId = 1;

    it('deve fazer upload de documento com sucesso', async () => {
      const mockStorageResult = {
        url: 'https://test.com/doc.pdf',
        urlTemp: 'https://test.com/temp/doc.pdf',
        hash: 'hash123',
        tamanho: 1000,
      };

      const mockDocumento = {
        id: '1',
        ...mockDto,
        ...mockStorageResult,
        status: StatusDocumento.PENDENTE,
      };

      mockStorageService.salvarArquivo.mockResolvedValue(mockStorageResult);
      mockDocumentoRepository.criar.mockResolvedValue(mockDocumento);

      const resultado = await service.upload(
        mockArquivo,
        mockNomeArquivo,
        mockMimeType,
        mockDto as any,
        mockUsuarioId,
      );

      expect(resultado).toEqual(mockDocumento);
      expect(mockStorageService.salvarArquivo).toHaveBeenCalled();
      expect(mockDocumentoRepository.criar).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });

    it('deve rejeitar tipo de arquivo inválido', async () => {
      await expect(
        service.upload(
          mockArquivo,
          'test.exe',
          'application/x-msdownload',
          mockDto as any,
          mockUsuarioId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('atualizar', () => {
    const mockId = '1';
    const mockDto = {
      nome: 'Novo nome',
      descricao: 'Nova descrição',
    };
    const mockUsuarioId = 1;

    it('deve atualizar documento com sucesso', async () => {
      const mockDocumentoExistente = {
        id: mockId,
        nome: 'Nome antigo',
        descricao: 'Descrição antiga',
      };

      const mockDocumentoAtualizado = {
        ...mockDocumentoExistente,
        ...mockDto,
      };

      mockDocumentoRepository.buscarPorId.mockResolvedValue(mockDocumentoExistente);
      mockDocumentoRepository.atualizar.mockResolvedValue(mockDocumentoAtualizado);

      const resultado = await service.atualizar(mockId, mockDto, mockUsuarioId);

      expect(resultado).toEqual(mockDocumentoAtualizado);
      expect(mockDocumentoRepository.atualizar).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });

    it('deve lançar erro quando documento não existir', async () => {
      mockDocumentoRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.atualizar(mockId, mockDto, mockUsuarioId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('analisar', () => {
    const mockId = '1';
    const mockDto = {
      status: StatusDocumento.APROVADO,
      observacoes: 'Documento aprovado',
    };
    const mockUsuarioId = 1;

    it('deve analisar documento com sucesso', async () => {
      const mockDocumentoExistente = {
        id: mockId,
        status: StatusDocumento.PENDENTE,
      };

      const mockDocumentoAnalisado = {
        ...mockDocumentoExistente,
        status: mockDto.status,
      };

      mockDocumentoRepository.buscarPorId.mockResolvedValue(mockDocumentoExistente);
      mockDocumentoRepository.atualizarStatus.mockResolvedValue(mockDocumentoAnalisado);

      const resultado = await service.analisar(mockId, mockDto, mockUsuarioId);

      expect(resultado).toEqual(mockDocumentoAnalisado);
      expect(mockDocumentoRepository.atualizarStatus).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    const mockFiltros = {
      tipo: TipoDocumento.CONTRATO,
      status: StatusDocumento.PENDENTE,
    };

    it('deve listar documentos com filtros', async () => {
      const mockDocumentos = [
        { id: '1', tipo: TipoDocumento.CONTRATO },
        { id: '2', tipo: TipoDocumento.CONTRATO },
      ];

      mockDocumentoRepository.listarPorFiltros.mockResolvedValue(mockDocumentos);
      mockDocumentoRepository.contarPorFiltros.mockResolvedValue(2);

      const resultado = await service.listar(mockFiltros);

      expect(resultado).toEqual({
        documentos: mockDocumentos,
        total: 2,
        filtros: mockFiltros,
      });
    });
  });

  describe('verificarDocumentosExpirados', () => {
    it('deve marcar documentos expirados', async () => {
      const mockDocumentosExpirados = [
        { id: '1', status: StatusDocumento.PENDENTE },
        { id: '2', status: StatusDocumento.APROVADO },
      ];

      mockDocumentoRepository.buscarDocumentosExpirados.mockResolvedValue(mockDocumentosExpirados);

      await service.verificarDocumentosExpirados();

      expect(mockDocumentoRepository.atualizarStatus).toHaveBeenCalledTimes(2);
      expect(mockAuditoriaService.registrar).toHaveBeenCalledTimes(2);
    });
  });
});
