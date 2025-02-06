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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const terminus_1 = require("@nestjs/terminus");
const prisma_service_1 = require("../infrastructure/prisma.service");
let HealthController = class HealthController {
    constructor(health, http, disk, memory, prismaHealth, prisma) {
        this.health = health;
        this.http = http;
        this.disk = disk;
        this.memory = memory;
        this.prismaHealth = prismaHealth;
        this.prisma = prisma;
    }
    check() {
        return this.health.check([
            // Banco de dados
            () => this.prismaHealth.pingCheck('database', this.prisma),
            // Uso de disco
            () => this.disk.checkStorage('storage', {
                path: '/',
                thresholdPercent: 0.9
            }),
            // Uso de memória
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
            () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
            // APIs externas críticas
            () => this.http.pingCheck('api_consignante', 'https://api.consignante.com.br/health'),
            () => this.http.pingCheck('api_banco', 'https://api.banco.com.br/health'),
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar status da API' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'API está funcionando normalmente',
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    example: 'ok'
                },
                timestamp: {
                    type: 'string',
                    example: new Date().toISOString()
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.HttpHealthIndicator,
        terminus_1.DiskHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        terminus_1.PrismaHealthIndicator, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], HealthController);
