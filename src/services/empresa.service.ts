import { Empresa, IEmpresa } from "../domain/empresa.entity";
import { CriarEmpresaDto } from "../dtos/criar-empresa.dto";
import { EmpresaPrismaRepository } from "../repositories/empresa.prisma.repository";

/**
 * Serviço para operações relacionadas a Empresa.
 */
export class EmpresaService {
  constructor(
    private readonly repository: EmpresaPrismaRepository = new EmpresaPrismaRepository()
  ) {}

  /**
   * Cria uma nova Empresa.
   * @param dto Dados para criação da Empresa.
   * @returns Empresa criada.
   */
  async criarEmpresa(dto: CriarEmpresaDto): Promise<IEmpresa> {
    const empresa = new Empresa(
      0,
      dto.nome,
      dto.cnpj,
      true
    );
    return await this.repository.criar(empresa);
  }

  /**
   * Lista todas as Empresas.
   */
  async listarEmpresas(): Promise<IEmpresa[]> {
    return await this.repository.listar();
  }
} 