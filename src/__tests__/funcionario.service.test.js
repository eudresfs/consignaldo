"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const funcionario_service_1 = require("../services/funcionario.service");
describe('FuncionarioService', () => {
    let service;
    beforeEach(() => {
        service = new funcionario_service_1.FuncionarioService();
    });
    it('deve criar um funcionário com sucesso', async () => {
        const dto = {
            pessoaId: 1,
            empresaId: 1,
            matricula: '123456',
            cargo: 'Analista',
            setor: 'TI',
            situacao: 1,
            margemBruta: 5000,
            margemLiquida: 3000,
        };
        const funcionario = await service.criarFuncionario(dto);
        expect(funcionario).toHaveProperty('id');
        expect(funcionario.matricula).toEqual(dto.matricula);
        expect(funcionario.situacao).toEqual(dto.situacao);
    });
    it('deve listar os funcionários', async () => {
        // Garante que o retorno seja um array.
        const funcionarios = await service.listarFuncionarios();
        expect(Array.isArray(funcionarios)).toBe(true);
    });
});
