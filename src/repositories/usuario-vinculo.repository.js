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
exports.UsuarioVinculoRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
let UsuarioVinculoRepository = class UsuarioVinculoRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.usuarioVinculo.create({ data });
    }
    async findAll() {
        return this.prisma.usuarioVinculo.findMany({
            where: { ativo: true },
            include: {
                usuario: true,
                vinculo: {
                    include: {
                        consignataria: true,
                        consignante: true
                    }
                }
            }
        });
    }
    async findById(id) {
        return this.prisma.usuarioVinculo.findUnique({
            where: { id },
            include: {
                usuario: true,
                vinculo: {
                    include: {
                        consignataria: true,
                        consignante: true
                    }
                }
            }
        });
    }
    async update(id, data) {
        return this.prisma.usuarioVinculo.update({
            where: { id },
            data
        });
    }
    async softDelete(id) {
        return this.prisma.usuarioVinculo.update({
            where: { id },
            data: { ativo: false }
        });
    }
    async findByUsuario(usuarioId) {
        return this.prisma.usuarioVinculo.findMany({
            where: {
                usuarioId,
                ativo: true
            },
            include: {
                vinculo: {
                    include: {
                        consignataria: true,
                        consignante: true
                    }
                }
            }
        });
    }
    async findByVinculo(vinculoId) {
        return this.prisma.usuarioVinculo.findMany({
            where: {
                vinculoId,
                ativo: true
            },
            include: {
                usuario: true
            }
        });
    }
};
exports.UsuarioVinculoRepository = UsuarioVinculoRepository;
exports.UsuarioVinculoRepository = UsuarioVinculoRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsuarioVinculoRepository);
