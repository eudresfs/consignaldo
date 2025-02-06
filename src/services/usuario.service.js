"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const bcrypt_1 = require("bcrypt");
const role_enum_1 = require("../domain/enums/role.enum");
const logger_service_1 = require("../infrastructure/logger/logger.service");
let UsuarioService = class UsuarioService {
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    async findById(id) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: {
                usuarioVinculo: {
                    where: { ativo: true },
                    include: { vinculo: true },
                },
            },
        });
        if (!usuario) {
            throw new common_1.NotFoundException(`Usuário #${id} não encontrado`);
        }
        return {
            ...usuario,
            roles: this.getRolesFromVinculos(usuario.usuarioVinculo),
        };
    }
    async findByEmail(email) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { email },
            include: {
                usuarioVinculo: {
                    where: { ativo: true },
                    include: { vinculo: true },
                },
            },
        });
        if (!usuario) {
            return null;
        }
        return {
            ...usuario,
            roles: this.getRolesFromVinculos(usuario.usuarioVinculo),
        };
    }
    async create(data) {
        const senhaHash = await (0, bcrypt_1.hash)(data.senha, 10);
        const usuario = await this.prisma.usuario.create({
            data: {
                nome: data.nome,
                email: data.email,
                senha: senhaHash,
                ativo: true,
                tentativasLogin: 0,
            },
        });
        if (data.vinculoId) {
            await this.prisma.usuarioVinculo.create({
                data: {
                    usuarioId: usuario.id,
                    vinculoId: data.vinculoId,
                    ativo: true,
                },
            });
        }
        this.logger.log('Usuário criado com sucesso', 'UsuarioService', { userId: usuario.id });
        return usuario;
    }
    async resetLoginAttempts(id) {
        await this.prisma.usuario.update({
            where: { id },
            data: {
                tentativasLogin: 0,
                bloqueadoAte: null,
            },
        });
    }
    async incrementLoginAttempts(id) {
        await this.prisma.usuario.update({
            where: { id },
            data: {
                tentativasLogin: {
                    increment: 1,
                },
            },
        });
    }
    async blockUser(id, bloqueadoAte) {
        await this.prisma.usuario.update({
            where: { id },
            data: {
                bloqueadoAte,
                tentativasLogin: 0,
            },
        });
    }
    async updateLastAccess(id) {
        await this.prisma.usuario.update({
            where: { id },
            data: {
                ultimoAcesso: new Date(),
            },
        });
    }
    getRolesFromVinculos(vinculos) {
        const roles = new Set();
        // Admin tem acesso total
        if (vinculos.some(v => v.vinculo.tipo === 'ADMIN')) {
            roles.add(role_enum_1.Role.ADMIN);
        }
        // Mapeia tipos de vínculo para roles
        vinculos.forEach(v => {
            switch (v.vinculo.tipo) {
                case 'CONSIGNATARIA':
                    roles.add(role_enum_1.Role.CONSIGNATARIA);
                    break;
                case 'CONSIGNANTE':
                    roles.add(role_enum_1.Role.CONSIGNANTE);
                    break;
                case 'SERVIDOR':
                    roles.add(role_enum_1.Role.SERVIDOR);
                    break;
                case 'OPERADOR':
                    roles.add(role_enum_1.Role.OPERADOR);
                    break;
            }
        });
        return Array.from(roles);
    }
};
exports.UsuarioService = UsuarioService;
exports.UsuarioService = UsuarioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], UsuarioService);
