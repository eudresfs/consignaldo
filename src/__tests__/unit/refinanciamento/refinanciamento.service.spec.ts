import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RefinanciamentoService } from '../../../services/refinanciamento.service';
import { RefinanciamentoRepository } from '../../../repositories/refinanciamento.repository';
import { ContratoRepository } from '../../../repositories/contrato.repository';
import { ServidorRepository } from '../../../repositories/servidor.repository';
import { DocumentoService } from '../../../services/documento.service';
import { AuditoriaService } from '../../../services/auditoria.service';
import { BancoIntegrationFactory } from '../../../services/bancos/banco-integration.factory';
import { 
  StatusRefinanciamento,
  TipoRecusaRefinanciamento 
} from '../../../domain/refinanciamento/refinanciamento.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RefinanciamentoService', () => {
  let service: RefinanciamentoService;
  let refinanciamentoRepository: RefinanciamentoRepository;
  let contratoRepository: ContratoRepository;
  let servidorRepository: ServidorRepository;
  let documentoService: DocumentoService;
  let auditoriaService: AuditoriaService;
  let bancoIntegrationFactory: BancoIntegrationFactory;

  const mockRefinanciamentoRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    atualizarStatus: jest.fn(),
    listarPorFiltros: jest.fn(),
    contarPorFiltros: jest.fn(),
    buscarPorContrato: jest.fn(),
    obterEstatisticas: jest.fn()
  };

  const mockContratoRepository = {
    buscarPorId: jest.fn()
  };

  const mockServidorRepository = {
    buscarPorId: jest.fn()
  };

  const mockDocumentoService = {
    upload: jest.fn()
  };

  const mockAuditoriaService = {
    registrar: jest.fn()
  };

  const mockBancoIntegration = {
    simularRefinanciamento: jest.fn(),
    solicitarRefinanciamento: jest.fn(),
    consultarRefinanciamento: jest.fn(),
    cancelarRefinanciamento: jest.fn()
  };

  const mockBancoIntegrationFactory = {
    getIntegracao: jest.fn().mockReturnValue(mockBancoIntegration)
  };

  const mockConfigService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefinanciamentoService,
        {
          provide: RefinanciamentoRepository,
          useValue: mockRefinanciamentoRepository
        },
        {
          provide: ContratoRepository,
          useValue: mockContratoRepository
        },
        {
          provide: ServidorRepository,
          useValue: mockServidorRepository
        },
        {
          provide: DocumentoService,
          useValue: mockDocumentoService
        },
        {
          provide: AuditoriaService,
          useValue: mockAuditoriaService
        },
        {
          provide: BancoIntegrationFactory,
          useValue: mockBancoIntegrationFactory
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<RefinanciamentoService>(RefinanciamentoService);
    refinanciamentoRepository = module.get<RefinanciamentoRepository>(RefinanciamentoRepository);
    contratoRepository = module.get<ContratoRepository>(ContratoRepository);
    servidorRepository = module.get<ServidorRepository>(ServidorRepository);
    documentoService = module.get<DocumentoService>(DocumentoService);
    auditoriaService = module.get<AuditoriaService>(AuditoriaService);
    bancoIntegrationFactory = module.get<BancoIntegrationFactory>(BancoIntegrationFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('simular', () => {
    const mockDto = {
      contratoId: '1',
      valorContrato: 10000,
      valorParcela: 500,
      taxaJuros: 2.5,
      prazoTotal: 24,
      parcelasPagas: 6,
      saldoDevedor: 8000
    };

    const mockContrato = {
      id: '1',
      bancoId: 1
    };

    const mockSimulacaoBanco = {
      protocolo: 'SIM123',
      taxaJuros: 2.2,
      valorParcela: 450,
      prazo: 24,
      valorFinanciado: 8000,
      custoEfetivo: 2.4,
      dataValidade: new Date()
    };

    it('deve simular refinanciamento com sucesso', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue(mockContrato);
      mockBancoIntegration.simularRefinanciamento.mockResolvedValue(mockSimulacaoBanco);

      const resultado = await service.simular(mockDto);

      expect(resultado).toBeDefined();
      expect(resultado.economia).toBeDefined();
      expect(mockBancoIntegration.simularRefinanciamento).toHaveBeenCalled();
    });

    it('deve rejeitar quando contrato não existe', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.simular(mockDto)).rejects.toThrow(NotFoundException);
    });

    it('deve rejeitar quando parcelas pagas insuficientes', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue(mockContrato);
      const dtoInvalido = { ...mockDto, parcelasPagas: 3 };

      await expect(service.simular(dtoInvalido)).rejects.toThrow(BadRequestException);
    });
  });

  describe('criar', () => {
    const mockDto = {
      contratoId: '1',
      bancoId: 1,
      servidorId: 1,
      valorContrato: 10000,
      valorParcela: 500,
      taxaJurosAtual: 2.5,
      taxaJurosNova: 2.2,
      prazoTotal: 24,
      parcelasPagas: 6,
      saldoDevedor: 8000,
      documentos: ['doc1.pdf']
    };

    const mockServidor = {
      id: 1,
      margemConsignavel: 1000,
      salarioBruto: 5000
    };

    const mockSolicitacaoBanco = {
      protocolo: 'REF123',
      status: StatusRefinanciamento.AGUARDANDO_ANALISE,
      dataProcessamento: new Date()
    };

    it('deve criar refinanciamento com sucesso', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue({ id: '1' });
      mockRefinanciamentoRepository.buscarPorContrato.mockResolvedValue(null);
      mockServidorRepository.buscarPorId.mockResolvedValue(mockServidor);
      mockBancoIntegration.solicitarRefinanciamento.mockResolvedValue(mockSolicitacaoBanco);

      const resultado = await service.criar(mockDto, 1);

      expect(resultado).toBeDefined();
      expect(mockBancoIntegration.solicitarRefinanciamento).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });

    it('deve rejeitar quando já existe refinanciamento em andamento', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue({ id: '1' });
      mockRefinanciamentoRepository.buscarPorContrato.mockResolvedValue({ id: '2' });

      await expect(service.criar(mockDto, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('analisar', () => {
    const mockRefinanciamento = {
      id: '1',
      bancoId: 1,
      status: StatusRefinanciamento.AGUARDANDO_ANALISE,
      protocoloBanco: 'REF123'
    };

    const mockStatusBanco = {
      protocolo: 'REF123',
      status: StatusRefinanciamento.APROVADO,
      dataAtualizacao: new Date()
    };

    it('deve analisar refinanciamento com sucesso', async () => {
      mockRefinanciamentoRepository.buscarPorId.mockResolvedValue(mockRefinanciamento);
      mockBancoIntegration.consultarRefinanciamento.mockResolvedValue(mockStatusBanco);

      const resultado = await service.analisar(
        '1',
        { status: StatusRefinanciamento.APROVADO },
        1
      );

      expect(resultado).toBeDefined();
      expect(mockBancoIntegration.consultarRefinanciamento).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });

    it('deve rejeitar transição de status inválida', async () => {
      mockRefinanciamentoRepository.buscarPorId.mockResolvedValue({
        ...mockRefinanciamento,
        status: StatusRefinanciamento.REPROVADO
      });

      await expect(
        service.analisar('1', { status: StatusRefinanciamento.APROVADO }, 1)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
