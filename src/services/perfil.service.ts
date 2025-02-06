import { Perfil, IPerfil } from "../domain/perfil.entity";
import { CriarPerfilDto } from "../dtos/criar-perfil.dto";
import { PerfilPrismaRepository } from "../repositories/perfil.prisma.repository";

/**
 * Serviço para operações relacionadas a Perfil.
 */
export class PerfilService {
  constructor(
    private readonly repository: PerfilPrismaRepository = new PerfilPrismaRepository()
  ) {}

  /**
   * Cria um novo Perfil.
   * @param dto Dados para criação do Perfil.
   * @returns Perfil criado.
   */
  async criarPerfil(dto: CriarPerfilDto): Promise<IPerfil> {
    const perfil = new Perfil(
      0,
      dto.nome,
      dto.descricao,
      dto.ativo ?? true
    );
    return await this.repository.criar(perfil);
  }

  /**
   * Lista todos os Perfis.
   */
  async listarPerfis(): Promise<IPerfil[]> {
    return await this.repository.listar();
  }
} 