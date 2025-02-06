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
exports.VinculoRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infrastructure/prisma.service");
let VinculoRepository = class VinculoRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.vinculo.create({ data });
    }
    async findAll() {
        return this.prisma.vinculo.findMany({
            where: { ativo: true },
            include: {
                consignataria: true,
                consignante: true
            }
        });
    }
    async findById(id) {
        return this.prisma.vinculo.findUnique({
            where: { id },
            include: {
                consignataria: true,
                consignante: true
            }
        });
    }
    async update(id, data) {
        return this.prisma.vinculo.update({
            where: { id },
            data
        });
    }
    async softDelete(id) {
        return this.prisma.vinculo.update({
            where: { id },
            data: { ativo: false }
        });
    }
    async findByConsignataria(consignatariaId) {
        return this.prisma.vinculo.findMany({
            where: {
                consignatariaId,
                ativo: true
            },
            include: {
                consignante: true
            }
        });
    }
    async findByConsignante(consignanteId) {
        return this.prisma.vinculo.findMany({
            where: {
                consignanteId,
                ativo: true
            },
            include: {
                consignataria: true
            }
        });
    }
    async findByConsignatariaAndConsignante(consignatariaId, consignanteId) {
        return this.prisma.vinculo.findFirst({
            where: {
                consignatariaId,
                consignanteId,
                ativo: true
            }
        });
    }
};
exports.VinculoRepository = VinculoRepository;
exports.VinculoRepository = VinculoRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], VinculoRepository);
