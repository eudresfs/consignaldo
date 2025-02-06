import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IPerfil } from '../../domain/perfil.entity';

/**
 * Repositório de Perfil utilizando o Prisma para persistência.
 */
export class PerfilRepository extends BaseRepository<IPerfil> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'perfil' as keyof PrismaClient;
  }

  /**
   * Cria um novo Perfil no banco de dados.
   * @param perfil Instância do Perfil a ser persistido.
   * @returns Perfil criado com os dados persistidos.
   */
  async criar(perfil: IPerfil): Promise<IPerfil> {
    const created = await this.prisma.perfil.create({
      data: {
        nome: perfil.nome,
        descricao: perfil.descricao,
        ativo: perfil.ativo,
      },
    });
    return {
      ...perfil,
      id: created.id,
      criadoEm: created.createdAt || new Date(),
      atualizadoEm: created.updatedAt || new Date(),
    };
  }

  /**
   * Lista todos os Perfis cadastrados.
   * @returns Array de Perfis.
   */
  async listar(): Promise<IPerfil[]> {
    const perfis = await this.prisma.perfil.findMany();
    return perfis.map(p => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      ativo: p.ativo,
      criadoEm: p.createdAt,
      atualizadoEm: p.updatedAt,
    }));
  }
} 