import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma.repository';
import type { IFuncionario } from '../../domain/funcionario.entity';

export class FuncionarioRepository extends BaseRepository<IFuncionario> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  // Forçamos o cast da string 'funcionario' para o tipo esperado
  protected getModelName(): keyof PrismaClient {
    return 'funcionario' as keyof PrismaClient;
  }

  // Método específico para buscar funcionário pela matrícula
  async findByMatricula(matricula: string): Promise<IFuncionario | null> {
    const result = await (this.prisma[this.getModelName()] as any).findUnique({
      where: { matricula },
    });
    return result ? this.mapDates(result) : null;
  }

  // Método auxiliar para mapear os campos de data
  private mapDates(funcionario: any): IFuncionario {
    const { criadoEm, atualizadoEm, ...rest } = funcionario;
    return {
      ...rest,
      createdAt: new Date(criadoEm || funcionario.createdAt),
      updatedAt: new Date(atualizadoEm || funcionario.updatedAt),
    };
  }
} 