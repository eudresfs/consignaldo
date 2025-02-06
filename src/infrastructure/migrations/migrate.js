"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataMigrator = void 0;
class DataMigrator {
    constructor(prisma, legacyDb) {
        this.prisma = prisma;
        this.legacyDb = legacyDb;
    }
    async migrate() {
        await this.migrateEmpresas();
        await this.migrateFuncionarios();
        await this.migrateAverbacoes();
    }
    async migrateEmpresas() {
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
}
exports.DataMigrator = DataMigrator;
