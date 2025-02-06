import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IEmpresa } from '../../domain/empresa.entity';

/**
 * Repositório de Empresa utilizando o Prisma para persistência.
 */
export class EmpresaRepository extends BaseRepository<IEmpresa> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModelName(): keyof PrismaClient {
    return 'empresa' as keyof PrismaClient;
  }

  /**
   * Busca uma empresa pelo CNPJ
   */
  async findByCnpj(cnpj: string): Promise<IEmpresa | null> {
    return (this.prisma[this.getModelName()] as any).findUnique({
      where: { cnpj },
    });
  }

  /**
   * Cria uma nova Empresa no banco de dados.
   * @param empresa Instância da entidade Empresa a ser persistida.
   * @returns Empresa criada com os dados persistidos.
   */
  async criar(empresa: IEmpresa): Promise<IEmpresa> {
    const created = await this.prisma.empresa.create({
      data: {
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        ativo: empresa.ativo,
      },
    });
    return {
      ...empresa,
      id: created.id,
      createdAt: created.createdAt || new Date(),
      updatedAt: created.updatedAt || new Date(),
    };
  }

  /**
   * Lista todas as Empresas cadastradas.
   * @returns Array de Empresas.
   */
  async listar(): Promise<IEmpresa[]> {
    const empresas = await this.prisma.empresa.findMany();
    return empresas.map(e => ({
      id: e.id,
      nome: e.nome,
      cnpj: e.cnpj,
      ativo: e.ativo,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }
} 