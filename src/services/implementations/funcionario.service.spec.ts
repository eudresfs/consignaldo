/**
 * Testes unitários para o FuncionarioService.
 */
import { FuncionarioService } from './funcionario.service';
import { FuncionarioRepository } from '../../repositories/implementations/funcionario.repository';
import type { IFuncionario } from '../../domain/funcionario.entity';

describe('FuncionarioService', () => {
  let funcionarioService: FuncionarioService;
  let funcionarioRepository: Partial<FuncionarioRepository>;

  const funcionarioMock: IFuncionario = {
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

    funcionarioService = new FuncionarioService(funcionarioRepository as FuncionarioRepository);
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