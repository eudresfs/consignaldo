import { Funcionario, IFuncionario } from '../domain/funcionario.entity';
import { CriarFuncionarioDto } from '../dtos/criar-funcionario.dto';
import { FuncionarioPrismaRepository } from '../repositories/funcionario.prisma.repository';

/**
 * Serviço para operações relacionadas a Funcionário.
 */
export class FuncionarioService {
  constructor(
    private readonly repository: FuncionarioPrismaRepository = new FuncionarioPrismaRepository()
  ) {}

  /**
   * Cria um novo Funcionário.
   * @param dto Dados para criação do Funcionário.
   * @returns Funcionário criado.
   */
  async criarFuncionario(dto: CriarFuncionarioDto): Promise<IFuncionario> {
    const funcionario = new Funcionario(
      0,
      dto.pessoaId,
      dto.empresaId,
      dto.matricula,
      dto.cargo || '',
      dto.setor || '',
      dto.situacao,
      dto.margemBruta,
      dto.margemLiquida,
      undefined,
      true
    );
    return await this.repository.criar(funcionario);
  }

  /**
   * Lista todos os Funcionários.
   */
  async listarFuncionarios(): Promise<IFuncionario[]> {
    return await this.repository.listar();
  }
} 