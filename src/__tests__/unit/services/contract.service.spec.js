"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const contract_service_1 = require("../../../services/contract.service");
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const margem_service_1 = require("../../../services/margem.service");
const validacao_service_1 = require("../../../services/validacao.service");
const status_contrato_enum_1 = require("../../../domain/enums/status-contrato.enum");
const margem_insuficiente_exception_1 = require("../../../exceptions/margem-insuficiente.exception");
const prazo_invalido_exception_1 = require("../../../exceptions/prazo-invalido.exception");
const dia_corte_invalido_exception_1 = require("../../../exceptions/dia-corte-invalido.exception");
describe('ContractService', () => {
    let service;
    let prisma;
    let margemService;
    let validacaoService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                contract_service_1.ContractService,
                {
                    provide: prisma_service_1.PrismaService,
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
                    provide: margem_service_1.MargemService,
                    useValue: {
                        validarMargem: jest.fn(),
                        calcularMargemDisponivel: jest.fn(),
                    },
                },
                {
                    provide: validacao_service_1.ValidacaoService,
                    useValue: {
                        validarPrazo: jest.fn(),
                        validarDiaCorte: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(contract_service_1.ContractService);
        prisma = module.get(prisma_service_1.PrismaService);
        margemService = module.get(margem_service_1.MargemService);
        validacaoService = module.get(validacao_service_1.ValidacaoService);
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
                    status: status_contrato_enum_1.StatusContrato.AGUARDANDO,
                    valor: mockProposta.valor,
                    prazo: mockProposta.prazo,
                    parcela: mockProposta.parcela,
                    diaCorte: dto.diaCorte,
                },
            });
        });
        it('deve rejeitar se margem for insuficiente', async () => {
            jest.spyOn(margemService, 'validarMargem')
                .mockRejectedValue(new margem_insuficiente_exception_1.MargemInsuficienteException({
                margem: 1000,
                parcela: 1500,
                matricula: mockServidor.matricula,
            }));
            await expect(service.criarContrato(dto))
                .rejects
                .toThrow(margem_insuficiente_exception_1.MargemInsuficienteException);
        });
        it('deve rejeitar se prazo for inválido', async () => {
            jest.spyOn(margemService, 'validarMargem')
                .mockResolvedValue(true);
            jest.spyOn(validacaoService, 'validarPrazo')
                .mockReturnValue(false);
            await expect(service.criarContrato(dto))
                .rejects
                .toThrow(prazo_invalido_exception_1.PrazoInvalidoException);
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
                .toThrow(dia_corte_invalido_exception_1.DiaCorteInvalidoException);
        });
    });
    describe('liquidarContrato', () => {
        const mockContrato = {
            id: 1,
            valor: 10000,
            prazo: 24,
            parcela: 500,
            status: status_contrato_enum_1.StatusContrato.AVERBADO,
            parcelasRestantes: 20,
        };
        it('deve liquidar contrato com sucesso', async () => {
            jest.spyOn(prisma.contrato, 'findUnique')
                .mockResolvedValue(mockContrato);
            await service.liquidarContrato(1);
            expect(prisma.contrato.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    status: status_contrato_enum_1.StatusContrato.LIQUIDADO,
                    dataLiquidacao: expect.any(Date),
                },
            });
        });
        it('deve rejeitar liquidação de contrato já liquidado', async () => {
            jest.spyOn(prisma.contrato, 'findUnique')
                .mockResolvedValue({
                ...mockContrato,
                status: status_contrato_enum_1.StatusContrato.LIQUIDADO,
            });
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
            status: status_contrato_enum_1.StatusContrato.AVERBADO,
            parcelasRestantes: 20,
            taxaJuros: 1.99,
        };
        it('deve calcular valor de quitação corretamente', async () => {
            jest.spyOn(prisma.contrato, 'findUnique')
                .mockResolvedValue(mockContrato);
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
                status: status_contrato_enum_1.StatusContrato.LIQUIDADO,
            });
            await expect(service.calcularValorQuitacao(1))
                .rejects
                .toThrow('Contrato já está liquidado');
        });
    });
});
