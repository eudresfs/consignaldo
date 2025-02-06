"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const database_error_1 = require("../../errors/database.error");
/**
 * BaseRepository injeta o delegate (ex.: prisma.funcionario)
 * em vez de uma string com o nome do modelo.
 */
class BaseRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma[this.getModelName()].findUnique({
            where: { id },
        });
    }
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma[this.getModelName()].findMany({
                skip,
                take: limit,
            }),
            this.prisma[this.getModelName()].count(),
        ]);
        return {
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async create(data) {
        try {
            return await this.prisma[this.getModelName()].create({ data });
        }
        catch (error) {
            throw new database_error_1.DatabaseError('Erro ao criar registro', error);
        }
    }
    async update(id, data) {
        return this.prisma[this.getModelName()].update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        await this.prisma[this.getModelName()].delete({ where: { id } });
    }
}
exports.BaseRepository = BaseRepository;
