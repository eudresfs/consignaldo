import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaService } from '../../../services/auditoria.service';
import { AuditoriaRepository } from '../../../repositories/auditoria.repository';
import { 
  TipoAuditoria, 
  TipoOperacao, 
  NivelCriticidade 
} from '../../../domain/auditoria/auditoria.types';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let repository: AuditoriaRepository;

  const mockAuditoriaRepository = {
    registrar: jest.fn(),
    buscarPorId: jest.fn(),
    listarPorFiltros: jest.fn(),
    contarPorFiltros: jest.fn(),
    obterEstatisticas: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        {
          provide: AuditoriaRepository,
          useValue: mockAuditoriaRepository,
        },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
    repository = module.get<AuditoriaRepository>(AuditoriaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrar', () => {
    it('deve registrar uma nova auditoria com sucesso', async () => {
      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
      };

      const mockRegistro = {
        id: '1',
        tipo: TipoAuditoria.AUTENTICACAO,
        operacao: TipoOperacao.PROCESSAR,
        criticidade: NivelCriticidade.ALTO,
        usuarioId: 1,
      };

      mockAuditoriaRepository.registrar.mockResolvedValue(mockRegistro);

      const resultado = await service.registrar(
        {
          tipo: TipoAuditoria.AUTENTICACAO,
          operacao: TipoOperacao.PROCESSAR,
          criticidade: NivelCriticidade.ALTO,
        },
        1,
        mockRequest as any,
      );

      expect(resultado).toEqual(mockRegistro);
      expect(mockAuditoriaRepository.registrar).toHaveBeenCalledWith({
        tipo: TipoAuditoria.AUTENTICACAO,
        operacao: TipoOperacao.PROCESSAR,
        criticidade: NivelCriticidade.ALTO,
        usuarioId: 1,
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });
  });

  describe('registrarAutenticacao', () => {
    it('deve registrar auditoria de autenticação com sucesso', async () => {
      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
      };

      const mockRegistro = {
        id: '1',
        tipo: TipoAuditoria.AUTENTICACAO,
        operacao: TipoOperacao.PROCESSAR,
        criticidade: NivelCriticidade.ALTO,
      };

      mockAuditoriaRepository.registrar.mockResolvedValue(mockRegistro);

      const resultado = await service.registrarAutenticacao(
        1,
        true,
        mockRequest as any,
        { detalhes: 'Login bem-sucedido' },
      );

      expect(resultado).toEqual(mockRegistro);
      expect(mockAuditoriaRepository.registrar).toHaveBeenCalled();
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar um registro de auditoria por ID', async () => {
      const mockRegistro = {
        id: '1',
        tipo: TipoAuditoria.AUTENTICACAO,
        operacao: TipoOperacao.PROCESSAR,
        criticidade: NivelCriticidade.ALTO,
      };

      mockAuditoriaRepository.buscarPorId.mockResolvedValue(mockRegistro);

      const resultado = await service.buscarPorId('1');

      expect(resultado).toEqual(mockRegistro);
      expect(mockAuditoriaRepository.buscarPorId).toHaveBeenCalledWith('1');
    });

    it('deve lançar erro quando registro não for encontrado', async () => {
      mockAuditoriaRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarPorId('1')).rejects.toThrow(
        'Registro de auditoria 1 não encontrado',
      );
    });
  });

  describe('listarRegistros', () => {
    it('deve listar registros de auditoria com filtros', async () => {
      const mockFiltros = {
        tipo: TipoAuditoria.AUTENTICACAO,
        dataInicial: '2025-01-01',
        dataFinal: '2025-12-31',
      };

      const mockRegistros = [
        {
          id: '1',
          tipo: TipoAuditoria.AUTENTICACAO,
          operacao: TipoOperacao.PROCESSAR,
          criticidade: NivelCriticidade.ALTO,
        },
      ];

      mockAuditoriaRepository.listarPorFiltros.mockResolvedValue(mockRegistros);
      mockAuditoriaRepository.contarPorFiltros.mockResolvedValue(1);

      const resultado = await service.listarRegistros(mockFiltros);

      expect(resultado).toEqual({
        registros: mockRegistros,
        total: 1,
        filtros: mockFiltros,
      });
    });
  });

  describe('obterEstatisticas', () => {
    it('deve retornar estatísticas de auditoria', async () => {
      const mockEstatisticas = {
        totalRegistros: 100,
        registrosPorTipo: [
          { tipo: TipoAuditoria.AUTENTICACAO, _count: 50 },
          { tipo: TipoAuditoria.CONTRATO, _count: 50 },
        ],
        registrosPorOperacao: [
          { operacao: TipoOperacao.CRIAR, _count: 30 },
          { operacao: TipoOperacao.ATUALIZAR, _count: 70 },
        ],
        registrosPorCriticidade: [
          { criticidade: NivelCriticidade.ALTO, _count: 40 },
          { criticidade: NivelCriticidade.MEDIO, _count: 60 },
        ],
      };

      mockAuditoriaRepository.obterEstatisticas.mockResolvedValue(mockEstatisticas);

      const resultado = await service.obterEstatisticas();

      expect(resultado).toEqual(mockEstatisticas);
      expect(mockAuditoriaRepository.obterEstatisticas).toHaveBeenCalled();
    });
  });
});
