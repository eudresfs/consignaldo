"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const integration_service_1 = require("../../services/integration.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../../infrastructure/logger/logger.service");
const cache_service_1 = require("../../infrastructure/cache/cache.service");
const integration_type_enum_1 = require("../../domain/enums/integration-type.enum");
const rxjs_1 = require("rxjs");
const integration_error_1 = require("../../domain/errors/integration.error");
describe('IntegrationService', () => {
    let service;
    let httpService;
    let prisma;
    let cache;
    const mockConfig = {
        id: 1,
        nome: 'Test Integration',
        tipo: integration_type_enum_1.IntegrationType.MARGEM,
        url: 'https://api.test.com',
        token: 'test-token',
        ativo: true,
        consignanteId: 1,
        timeoutMs: 5000,
        retries: 3,
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                integration_service_1.IntegrationService,
                {
                    provide: axios_1.HttpService,
                    useValue: {
                        request: jest.fn(),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        integrationConfig: {
                            findFirst: jest.fn(),
                        },
                    },
                },
                {
                    provide: logger_service_1.LoggerService,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                    },
                },
                {
                    provide: cache_service_1.CacheService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        generateKey: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(integration_service_1.IntegrationService);
        httpService = module.get(axios_1.HttpService);
        prisma = module.get(prisma_service_1.PrismaService);
        cache = module.get(cache_service_1.CacheService);
    });
    describe('consultarMargem', () => {
        const mockMargemData = {
            matricula: '123456',
            margemDisponivel: 1000,
            margemUtilizada: 500,
            margemTotal: 1500,
            contratos: [],
        };
        it('deve retornar dados do cache se disponível', async () => {
            const cachedResult = {
                success: true,
                data: mockMargemData,
                timestamp: new Date(),
                duration: 100,
            };
            jest.spyOn(cache, 'generateKey').mockReturnValue('test-key');
            jest.spyOn(cache, 'get').mockResolvedValue(cachedResult);
            const result = await service.consultarMargem(1, '123456');
            expect(result).toEqual(cachedResult);
            expect(httpService.request).not.toHaveBeenCalled();
        });
        it('deve consultar API e cachear resultado se cache vazio', async () => {
            jest.spyOn(cache, 'generateKey').mockReturnValue('test-key');
            jest.spyOn(cache, 'get').mockResolvedValue(null);
            jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
            jest.spyOn(httpService, 'request').mockReturnValue((0, rxjs_1.of)({
                data: mockMargemData,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
            }));
            const result = await service.consultarMargem(1, '123456');
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockMargemData);
            expect(cache.set).toHaveBeenCalled();
        });
        it('deve lidar com erros da API e cachear por menos tempo', async () => {
            jest.spyOn(cache, 'generateKey').mockReturnValue('test-key');
            jest.spyOn(cache, 'get').mockResolvedValue(null);
            jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
            jest.spyOn(httpService, 'request').mockReturnValue((0, rxjs_1.throwError)(() => new Error('API Error')));
            const result = await service.consultarMargem(1, '123456');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(cache.set).toHaveBeenCalledWith('test-key', expect.any(Object), 60);
        });
    });
    describe('averbarContrato', () => {
        const mockAverbacaoData = {
            matricula: '123456',
            contrato: 'CONT123',
            parcela: 100,
            prazo: 48,
            dataInicio: new Date(),
            banco: 'BANCO TEST',
            situacao: 'PENDENTE',
        };
        it('deve averbar contrato com sucesso', async () => {
            jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
            jest.spyOn(httpService, 'request').mockReturnValue((0, rxjs_1.of)({
                data: mockAverbacaoData,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
            }));
            const result = await service.averbarContrato(1, mockAverbacaoData);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockAverbacaoData);
        });
        it('deve lançar IntegrationError em caso de falha', async () => {
            jest.spyOn(prisma.integrationConfig, 'findFirst').mockResolvedValue(mockConfig);
            jest.spyOn(httpService, 'request').mockReturnValue((0, rxjs_1.throwError)(() => new Error('API Error')));
            await expect(service.averbarContrato(1, mockAverbacaoData))
                .rejects
                .toThrow(integration_error_1.IntegrationError);
        });
    });
});
