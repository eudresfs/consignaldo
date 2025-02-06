import { PrismaClient } from '@prisma/client';
import { SqlConnection } from 'mssql';

export class DataMigrator {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly legacyDb: SqlConnection
  ) {}

  async migrate() {
    await this.migrateEmpresas();
    await this.migrateFuncionarios();
    await this.migrateAverbacoes();
  }

  private async migrateEmpresas() {
    const empresas = await this.legacyDb.query('SELECT * FROM Empresa');
    
    for (const empresa of empresas) {
      await this.prisma.empresa.create({
        data: {
          nome: empresa.Nome,
          cnpj: empresa.CNPJ,
          tipo: this.mapTipoEmpresa(empresa.IDEmpresaTipo),
          ativo: empresa.Ativo === 1
        }
      });
    }
  }

  // Implementar outros métodos de migração...
} 