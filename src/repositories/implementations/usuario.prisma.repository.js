"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioPrismaRepository = void 0;
const client_1 = require("@prisma/client");
/**
 * Repositório de Usuário utilizando o Prisma para persistência.
 */
class UsuarioPrismaRepository {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    /**
     * Cria um novo Usuário no banco de dados.
     * @param usuario - Instância da entidade Usuário a ser persistida.
     * @returns O Usuário criado com os dados persistidos.
     */
    async criar(usuario) {
        const created = await this.prisma.usuario.create({
            data: {
                pessoaId: usuario.pessoaId,
                login: usuario.login,
                senha: usuario.senha,
                situacao: usuario.situacao,
                ativo: usuario.ativo,
            },
        });
        return {
            ...usuario,
            id: created.id,
            criadoEm: created.createdAt || new Date(),
            atualizadoEm: created.updatedAt || new Date(),
        };
    }
    /**
     * Lista todos os Usuários cadastrados.
     * @returns Array de Usuários.
     */
    async listar() {
        const usuarios = await this.prisma.usuario.findMany();
        return usuarios.map(u => ({
            id: u.id,
            pessoaId: u.pessoaId,
            login: u.login,
            senha: u.senha,
            situacao: u.situacao,
            ativo: u.ativo,
            criadoEm: u.createdAt,
            atualizadoEm: u.updatedAt,
            ultimoAcesso: u.ultimoAcesso,
        }));
    }
}
exports.UsuarioPrismaRepository = UsuarioPrismaRepository;
