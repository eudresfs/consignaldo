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
exports.ConsignatariaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infrastructure/prisma.service");
let ConsignatariaRepository = class ConsignatariaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.consignataria.create({ data });
    }
    async findAll() {
        return this.prisma.consignataria.findMany({
            where: { ativo: true }
        });
    }
    async findById(id) {
        return this.prisma.consignataria.findUnique({
            where: { id }
        });
    }
    async update(id, data) {
        return this.prisma.consignataria.update({
            where: { id },
            data
        });
    }
    async softDelete(id) {
        return this.prisma.consignataria.update({
            where: { id },
            data: { ativo: false }
        });
    }
    async findWithVinculos(id) {
        return this.prisma.consignataria.findUnique({
            where: { id },
            include: {
                vinculos: {
                    where: { ativo: true },
                    include: {
                        consignante: true
                    }
                }
            }
        });
    }
};
exports.ConsignatariaRepository = ConsignatariaRepository;
exports.ConsignatariaRepository = ConsignatariaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ConsignatariaRepository);
