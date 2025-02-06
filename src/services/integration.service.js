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
exports.IntegrationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
const cache_service_1 = require("../infrastructure/cache/cache.service");
const integration_type_enum_1 = require("../domain/enums/integration-type.enum");
const rxjs_1 = require("rxjs");
const fs_1 = require("fs");
const https_1 = require("https");
const integration_error_1 = require("../domain/errors/integration.error");
let IntegrationService = class IntegrationService {
    constructor(http, config, prisma, logger, cache) {
        this.http = http;
        this.config = config;
        this.prisma = prisma;
        this.logger = logger;
        this.cache = cache;
        this.CACHE_TTL = 300; // 5 minutos
        this.MAX_RETRIES = 3;
    }
    async importarFolhaPagamento(consignanteId, competencia, arquivo) {
        const config = await this.getIntegrationConfig(consignanteId, integration_type_enum_1.IntegrationType.FOLHA_PAGAMENTO);
        const startTime = Date.now();
        try {
            const formData = new FormData();
            formData.append('file', new Blob([arquivo]), 'folha.txt');
            formData.append('competencia', competencia);
            const response = await this.executeRequest(config, {
                method: 'POST',
                data: formData,
            });
            return {
                success: true,
                data: response.data,
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            this.logger.error('Erro ao importar folha de pagamento', error.stack, 'IntegrationService', { consignanteId, competencia });
            return {
                success: false,
                error: {
                    code: 'IMPORT_ERROR',
                    message: 'Erro ao importar folha de pagamento',
                    details: error.message,
                },
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };
        }
    }
    async consultarMargem(consignanteId, matricula) {
        const cacheKey = this.cache.generateKey('margem', { consignanteId, matricula });
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const config = await this.getIntegrationConfig(consignanteId, integration_type_enum_1.IntegrationType.MARGEM);
        const startTime = Date.now();
        try {
            const response = await this.executeRequest(config, {
                method: 'GET',
                url: `${config.url}/margem/${matricula}`,
            });
            const result = {
                success: true,
                data: response.data,
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };
            await this.cache.set(cacheKey, result, this.CACHE_TTL);
            return result;
        }
        catch (error) {
            const errorResult = {
                success: false,
                error: {
                    code: 'MARGEM_ERROR',
                    message: 'Erro ao consultar margem',
                    details: error.message,
                },
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };
            // Cache erro por menos tempo
            await this.cache.set(cacheKey, errorResult, 60);
            return errorResult;
        }
    }
    async averbarContrato(consignanteId, dados) {
        const config = await this.getIntegrationConfig(consignanteId, integration_type_enum_1.IntegrationType.AVERBACAO);
        const startTime = Date.now();
        try {
            const response = await this.executeRequest(config, {
                method: 'POST',
                url: `${config.url}/averbar`,
                data: dados,
            });
            return {
                success: true,
                data: response.data,
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            throw new integration_error_1.IntegrationError('Erro ao averbar contrato', {
                consignanteId,
                contrato: dados.contrato,
                error: error.message,
            });
        }
    }
    async getIntegrationConfig(consignanteId, tipo) {
        const config = await this.prisma.integrationConfig.findFirst({
            where: {
                consignanteId,
                tipo,
                ativo: true,
            },
        });
        if (!config) {
            throw new integration_error_1.IntegrationError('Configuração de integração não encontrada', {
                consignanteId,
                tipo,
            });
        }
        return config;
    }
    async executeRequest(config, options, retryCount = 0) {
        try {
            const httpsAgent = config.certificado
                ? new https_1.Agent({
                    cert: (0, fs_1.readFileSync)(config.certificado),
                    rejectUnauthorized: this.config.get('NODE_ENV') === 'production',
                })
                : undefined;
            const response = await (0, rxjs_1.firstValueFrom)(this.http.request({
                ...options,
                httpsAgent,
                headers: {
                    ...options.headers,
                    ...config.headers,
                    Authorization: config.token ? `Bearer ${config.token}` : undefined,
                },
                timeout: config.timeoutMs,
            }));
            return response;
        }
        catch (error) {
            if (retryCount < (config.retries || this.MAX_RETRIES)) {
                this.logger.warn(`Tentativa ${retryCount + 1} falhou, tentando novamente...`, 'IntegrationService', { config: config.id, error: error.message });
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                return this.executeRequest(config, options, retryCount + 1);
            }
            throw error;
        }
    }
};
exports.IntegrationService = IntegrationService;
exports.IntegrationService = IntegrationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        cache_service_1.CacheService])
], IntegrationService);
