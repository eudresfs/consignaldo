import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PortabilidadeService } from '../../../services/portabilidade.service';
import { PortabilidadeRepository } from '../../../repositories/portabilidade.repository';
import { ContratoRepository } from '../../../repositories/contrato.repository';
import { ServidorRepository } from '../../../repositories/servidor.repository';
import { DocumentoService } from '../../../services/documento.service';
import { AuditoriaService } from '../../../services/auditoria.service';
import { BancoIntegrationFactory } from '../../../services/bancos/banco-integration.factory';
import { 
  StatusPortabilidade,
  TipoRecusa 
} from '../../../domain/portabilidade/portabilidade.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PortabilidadeService', () => {
  let service: PortabilidadeService;
  let portabilidadeRepository: PortabilidadeRepository;
  let contratoRepository: ContratoRepository;
  let servidorRepository: ServidorRepository;
  let documentoService: DocumentoService;
  let auditoriaService: AuditoriaService;
  let bancoIntegrationFactory: BancoIntegrationFactory;

  const mockPortabilidadeRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    atualizarStatus: jest.fn(),
    listarPorFiltros: jest.fn(),
    contarPorFiltros: jest.fn(),
    buscarPorContratoOrigem: jest.fn(),
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
    simularPortabilidade: jest.fn(),
    solicitarPortabilidade: jest.fn(),
    consultarPortabilidade: jest.fn(),
    cancelarPortabilidade: jest.fn()
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
        PortabilidadeService,
        {
          provide: PortabilidadeRepository,
          useValue: mockPortabilidadeRepository
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

    service = module.get<PortabilidadeService>(PortabilidadeService);
    portabilidadeRepository = module.get<PortabilidadeRepository>(PortabilidadeRepository);
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
      contratoOrigemId: '1',
      valorSaldoDevedor: 10000,
      valorParcela: 500,
      taxaJurosAtual: 2.5,
      prazoRestante: 24,
      prazoTotal: 36,
      parcelasPagas: 12
    };

    const mockContrato = {
      id: '1',
      bancoId: 1
    };

    const mockSimulacaoBanco = {
      protocolo: 'SIM123',
      taxaJuros: 1.8,
      valorParcela: 450,
      prazo: 24,
      valorFinanciado: 10000,
      custoEfetivo: 2.1,
      dataValidade: new Date()
    };

    it('deve simular portabilidade com sucesso', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue(mockContrato);
      mockBancoIntegration.simularPortabilidade.mockResolvedValue(mockSimulacaoBanco);

      const resultado = await service.simular(mockDto);

      expect(resultado).toBeDefined();
      expect(resultado.economia).toBeDefined();
      expect(mockBancoIntegration.simularPortabilidade).toHaveBeenCalled();
    });

    it('deve rejeitar quando contrato não existe', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.simular(mockDto)).rejects.toThrow(NotFoundException);
    });

    it('deve rejeitar quando parcelas pagas insuficientes', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue(mockContrato);
      const dtoInvalido = { ...mockDto, parcelasPagas: 6 };

      await expect(service.simular(dtoInvalido)).rejects.toThrow(BadRequestException);
    });
  });

  describe('criar', () => {
    const mockDto = {
      contratoOrigemId: '1',
      bancoOrigemId: 1,
      bancoDestinoId: 2,
      servidorId: 1,
      valorSaldoDevedor: 10000,
      valorParcela: 500,
      taxaJurosAtual: 2.5,
      taxaJurosNova: 1.8,
      prazoRestante: 24,
      prazoTotal: 36,
      parcelasPagas: 12,
      documentos: ['doc1.pdf']
    };

    const mockServidor = {
      id: 1,
      margemConsignavel: 1000,
      salarioBruto: 5000
    };

    const mockSolicitacaoBanco = {
      protocolo: 'PORT123',
      status: StatusPortabilidade.AGUARDANDO_ANALISE,
      dataProcessamento: new Date()
    };

    it('deve criar portabilidade com sucesso', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue({ id: '1' });
      mockPortabilidadeRepository.buscarPorContratoOrigem.mockResolvedValue(null);
      mockServidorRepository.buscarPorId.mockResolvedValue(mockServidor);
      mockBancoIntegration.solicitarPortabilidade.mockResolvedValue(mockSolicitacaoBanco);

      const resultado = await service.criar(mockDto, 1);

      expect(resultado).toBeDefined();
      expect(mockBancoIntegration.solicitarPortabilidade).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });

    it('deve rejeitar quando já existe portabilidade em andamento', async () => {
      mockContratoRepository.buscarPorId.mockResolvedValue({ id: '1' });
      mockPortabilidadeRepository.buscarPorContratoOrigem.mockResolvedValue({ id: '2' });

      await expect(service.criar(mockDto, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('analisar', () => {
    const mockPortabilidade = {
      id: '1',
      bancoDestinoId: 2,
      status: StatusPortabilidade.AGUARDANDO_ANALISE,
      protocoloBanco: 'PORT123'
    };

    const mockStatusBanco = {
      protocolo: 'PORT123',
      status: StatusPortabilidade.APROVADA,
      dataAtualizacao: new Date()
    };

    it('deve analisar portabilidade com sucesso', async () => {
      mockPortabilidadeRepository.buscarPorId.mockResolvedValue(mockPortabilidade);
      mockBancoIntegration.consultarPortabilidade.mockResolvedValue(mockStatusBanco);

      const resultado = await service.analisar(
        '1',
        { status: StatusPortabilidade.APROVADA },
        1
      );

      expect(resultado).toBeDefined();
      expect(mockBancoIntegration.consultarPortabilidade).toHaveBeenCalled();
      expect(mockAuditoriaService.registrar).toHaveBeenCalled();
    });

    it('deve rejeitar transição de status inválida', async () => {
      mockPortabilidadeRepository.buscarPorId.mockResolvedValue({
        ...mockPortabilidade,
        status: StatusPortabilidade.REPROVADA
      });

      await expect(
        service.analisar('1', { status: StatusPortabilidade.APROVADA }, 1)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
