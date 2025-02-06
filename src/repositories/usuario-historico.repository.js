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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioHistoricoRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infrastructure/prisma.service");
let UsuarioHistoricoRepository = class UsuarioHistoricoRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.usuarioHistorico.create({ data });
    }
    async findAll() {
        return this.prisma.usuarioHistorico.findMany({
            where: { ativo: true },
            include: {
                usuario: true
            },
            orderBy: {
                modifiedOn: 'desc'
            }
        });
    }
    async findById(id) {
        return this.prisma.usuarioHistorico.findUnique({
            where: { id },
            include: {
                usuario: true
            }
        });
    }
    async findByUsuario(usuarioId) {
        return this.prisma.usuarioHistorico.findMany({
            where: {
                usuarioId,
                ativo: true
            },
            orderBy: {
                modifiedOn: 'desc'
            }
        });
    }
    async findByAcao(acao) {
        return this.prisma.usuarioHistorico.findMany({
            where: {
                acao,
                ativo: true
            },
            include: {
                usuario: true
            },
            orderBy: {
                modifiedOn: 'desc'
            }
        });
    }
    async findByPeriodo(dataInicio, dataFim) {
        return this.prisma.usuarioHistorico.findMany({
            where: {
                modifiedOn: {
                    gte: dataInicio,
                    lte: dataFim
                },
                ativo: true
            },
            include: {
                usuario: true
            },
            orderBy: {
                modifiedOn: 'desc'
            }
        });
    }
};
exports.UsuarioHistoricoRepository = UsuarioHistoricoRepository;
exports.UsuarioHistoricoRepository = UsuarioHistoricoRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], UsuarioHistoricoRepository);
