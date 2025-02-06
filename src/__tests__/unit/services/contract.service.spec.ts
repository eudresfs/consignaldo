import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from '../../../services/contract.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { MargemService } from '../../../services/margem.service';
import { ValidacaoService } from '../../../services/validacao.service';
import { StatusContrato } from '../../../domain/enums/status-contrato.enum';
import { MargemInsuficienteException } from '../../../exceptions/margem-insuficiente.exception';
import { PrazoInvalidoException } from '../../../exceptions/prazo-invalido.exception';
import { DiaCorteInvalidoException } from '../../../exceptions/dia-corte-invalido.exception';

describe('ContractService', () => {
  let service: ContractService;
  let prisma: PrismaService;
  let margemService: MargemService;
  let validacaoService: ValidacaoService;

  const mockServidor = {
    id: 1,
    nome: 'João Silva',
    cpf: '12345678900',
    matricula: '123456',
    salario: 5000,
  };

  const mockProposta = {
    id: 1,
    valor: 10000,
    prazo: 24,
    parcela: 500,
    status: 'APPROVED',
    servidorId: mockServidor.id,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        {
          provide: PrismaService,
          useValue: {
            servidor: {
              findUnique: jest.fn().mockResolvedValue(mockServidor),
            },
            proposta: {
              findUnique: jest.fn().mockResolvedValue(mockProposta),
            },
            contrato: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: MargemService,
          useValue: {
            validarMargem: jest.fn(),
            calcularMargemDisponivel: jest.fn(),
          },
        },
        {
          provide: ValidacaoService,
          useValue: {
            validarPrazo: jest.fn(),
            validarDiaCorte: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContractService>(ContractService);
    prisma = module.get<PrismaService>(PrismaService);
    margemService = module.get<MargemService>(MargemService);
    validacaoService = module.get<ValidacaoService>(ValidacaoService);
  });

  describe('criarContrato', () => {
    const dto = {
      propostaId: 1,
      diaCorte: 5,
    };

    it('deve criar contrato com sucesso', async () => {
      jest.spyOn(margemService, 'validarMargem')
        .mockResolvedValue(true);
      
      jest.spyOn(validacaoService, 'validarPrazo')
        .mockReturnValue(true);
      
      jest.spyOn(validacaoService, 'validarDiaCorte')
        .mockReturnValue(true);

      await service.criarContrato(dto);

      expect(prisma.contrato.create).toHaveBeenCalledWith({
        data: {
          propostaId: dto.propostaId,
          status: StatusContrato.AGUARDANDO,
          valor: mockProposta.valor,
          prazo: mockProposta.prazo,
          parcela: mockProposta.parcela,
          diaCorte: dto.diaCorte,
        },
      });
    });

    it('deve rejeitar se margem for insuficiente', async () => {
      jest.spyOn(margemService, 'validarMargem')
        .mockRejectedValue(new MargemInsuficienteException({
          margem: 1000,
          parcela: 1500,
          matricula: mockServidor.matricula,
        }));

      await expect(service.criarContrato(dto))
        .rejects
        .toThrow(MargemInsuficienteException);
    });

    it('deve rejeitar se prazo for inválido', async () => {
      jest.spyOn(margemService, 'validarMargem')
        .mockResolvedValue(true);
      
      jest.spyOn(validacaoService, 'validarPrazo')
        .mockReturnValue(false);

      await expect(service.criarContrato(dto))
        .rejects
        .toThrow(PrazoInvalidoException);
    });

    it('deve rejeitar se dia de corte for inválido', async () => {
      jest.spyOn(margemService, 'validarMargem')
        .mockResolvedValue(true);
      
      jest.spyOn(validacaoService, 'validarPrazo')
        .mockReturnValue(true);
      
      jest.spyOn(validacaoService, 'validarDiaCorte')
        .mockReturnValue(false);

      await expect(service.criarContrato(dto))
        .rejects
        .toThrow(DiaCorteInvalidoException);
    });
  });

  describe('liquidarContrato', () => {
    const mockContrato = {
      id: 1,
      valor: 10000,
      prazo: 24,
      parcela: 500,
      status: StatusContrato.AVERBADO,
      parcelasRestantes: 20,
    };

    it('deve liquidar contrato com sucesso', async () => {
      jest.spyOn(prisma.contrato, 'findUnique')
        .mockResolvedValue(mockContrato as any);

      await service.liquidarContrato(1);

      expect(prisma.contrato.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: StatusContrato.LIQUIDADO,
          dataLiquidacao: expect.any(Date),
        },
      });
    });

    it('deve rejeitar liquidação de contrato já liquidado', async () => {
      jest.spyOn(prisma.contrato, 'findUnique')
        .mockResolvedValue({
          ...mockContrato,
          status: StatusContrato.LIQUIDADO,
        } as any);

      await expect(service.liquidarContrato(1))
        .rejects
        .toThrow('Contrato já está liquidado');
    });
  });

  describe('calcularValorQuitacao', () => {
    const mockContrato = {
      id: 1,
      valor: 10000,
      prazo: 24,
      parcela: 500,
      status: StatusContrato.AVERBADO,
      parcelasRestantes: 20,
      taxaJuros: 1.99,
    };

    it('deve calcular valor de quitação corretamente', async () => {
      jest.spyOn(prisma.contrato, 'findUnique')
        .mockResolvedValue(mockContrato as any);

      const resultado = await service.calcularValorQuitacao(1);

      expect(resultado).toMatchObject({
        valorOriginal: mockContrato.valor,
        parcelasRestantes: mockContrato.parcelasRestantes,
        valorDesconto: expect.any(Number),
        valorFinal: expect.any(Number),
      });
    });

    it('deve rejeitar cálculo para contrato liquidado', async () => {
      jest.spyOn(prisma.contrato, 'findUnique')
        .mockResolvedValue({
          ...mockContrato,
          status: StatusContrato.LIQUIDADO,
        } as any);

      await expect(service.calcularValorQuitacao(1))
        .rejects
        .toThrow('Contrato já está liquidado');
    });
  });
});
