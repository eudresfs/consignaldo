"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaRepository = void 0;
const prisma_repository_1 = require("./prisma.repository");
/**
 * Repositório de Empresa utilizando o Prisma para persistência.
 */
class EmpresaRepository extends prisma_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    getModelName() {
        return 'empresa';
    }
    /**
     * Busca uma empresa pelo CNPJ
     */
    async findByCnpj(cnpj) {
        return this.prisma[this.getModelName()].findUnique({
            where: { cnpj },
        });
    }
    /**
     * Cria uma nova Empresa no banco de dados.
     * @param empresa Instância da entidade Empresa a ser persistida.
     * @returns Empresa criada com os dados persistidos.
     */
    async criar(empresa) {
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
    async listar() {
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
exports.EmpresaRepository = EmpresaRepository;
