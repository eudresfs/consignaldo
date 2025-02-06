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
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
const logger_service_1 = require("../logger/logger.service");
let CacheService = class CacheService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.client = (0, redis_1.createClient)({
            url: this.config.get('REDIS_URL'),
        });
        this.client.on('error', (error) => {
            this.logger.error('Erro na conexão com Redis', error.stack, 'CacheService');
        });
        this.connect();
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            this.logger.error('Falha ao conectar com Redis', error.stack, 'CacheService');
        }
    }
    generateKey(prefix, params) {
        const sortedParams = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join(':');
        return `${prefix}:${sortedParams}`;
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            this.logger.error('Erro ao ler do cache', error.stack, 'CacheService', { key });
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: ttlSeconds,
            });
        }
        catch (error) {
            this.logger.error('Erro ao gravar no cache', error.stack, 'CacheService', { key });
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            this.logger.error('Erro ao deletar do cache', error.stack, 'CacheService', { key });
        }
    }
    async flushAll() {
        try {
            await this.client.flushAll();
        }
        catch (error) {
            this.logger.error('Erro ao limpar cache', error.stack, 'CacheService');
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], CacheService);
