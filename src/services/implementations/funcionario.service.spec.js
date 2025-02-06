"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Testes unitários para o FuncionarioService.
 */
const funcionario_service_1 = require("./funcionario.service");
describe('FuncionarioService', () => {
    let funcionarioService;
    let funcionarioRepository;
    const funcionarioMock = {
        id: 1,
        nome: 'João Silva',
        cpf: '11122233344',
        cargo: 'Analista',
        email: 'joao.silva@example.com',
        dataAdmissao: new Date(),
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    beforeEach(() => {
        funcionarioRepository = {
            findById: jest.fn().mockResolvedValue(funcionarioMock),
            findByMatricula: jest.fn().mockResolvedValue(funcionarioMock)
        };
        funcionarioService = new funcionario_service_1.FuncionarioService(funcionarioRepository);
    });
    it('deve retornar um funcionário a partir do ID', async () => {
        const funcionario = await funcionarioService.findById(1);
        expect(funcionario).toEqual(funcionarioMock);
        expect(funcionarioRepository.findById).toHaveBeenCalledWith(1);
    });
    it('deve retornar um funcionário a partir da matrícula', async () => {
        const funcionario = await funcionarioService.findByMatricula('123456');
        expect(funcionario).toEqual(funcionarioMock);
        expect(funcionarioRepository.findByMatricula).toHaveBeenCalledWith('123456');
    });
});
