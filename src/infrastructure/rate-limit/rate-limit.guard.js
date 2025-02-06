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
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cache_service_1 = require("../cache/cache.service");
const logger_service_1 = require("../logger/logger.service");
let RateLimitGuard = class RateLimitGuard {
    constructor(reflector, cache, logger) {
        this.reflector = reflector;
        this.cache = cache;
        this.logger = logger;
    }
    async canActivate(context) {
        const config = this.reflector.get('rateLimit', context.getHandler());
        if (!config) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const key = this.generateKey(request);
        try {
            const result = await this.checkRateLimit(key, config);
            // Adiciona headers com informações do rate limit
            const response = context.switchToHttp().getResponse();
            response.header('X-RateLimit-Limit', config.points);
            response.header('X-RateLimit-Remaining', result.remaining);
            response.header('X-RateLimit-Reset', result.reset);
            return result.allowed;
        }
        catch (error) {
            this.logger.error('Erro ao verificar rate limit', error.stack, 'RateLimitGuard', { key });
            return true; // Em caso de erro, permite a requisição
        }
    }
    generateKey(request) {
        // Identifica por IP + ConsignanteId (se disponível)
        const ip = request.ip;
        const consignanteId = request.user?.consignanteId;
        return this.cache.generateKey('rate-limit', {
            ip,
            consignanteId: consignanteId || 'anonymous',
            path: request.path,
        });
    }
    async checkRateLimit(key, config) {
        const now = Date.now();
        const windowStart = now - (config.duration * 1000);
        // Busca histórico de requisições
        const requests = await this.cache.get(key) || [];
        // Remove requisições antigas
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        // Verifica se está bloqueado
        const blockKey = `${key}:blocked`;
        const blocked = await this.cache.get(blockKey);
        if (blocked) {
            throw new common_1.HttpException('Too Many Requests', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        // Verifica limite
        if (validRequests.length >= config.points) {
            // Se configurado, bloqueia por um período
            if (config.blockDuration) {
                await this.cache.set(blockKey, true, config.blockDuration);
            }
            throw new common_1.HttpException('Too Many Requests', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        // Adiciona nova requisição
        validRequests.push(now);
        await this.cache.set(key, validRequests, config.duration);
        return {
            allowed: true,
            remaining: config.points - validRequests.length,
            reset: Math.floor(now / 1000) + config.duration,
        };
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        cache_service_1.CacheService,
        logger_service_1.LoggerService])
], RateLimitGuard);
