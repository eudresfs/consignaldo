"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const payroll_service_1 = require("../../services/payroll.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const queue_service_1 = require("../../infrastructure/queue/queue.service");
const notification_service_1 = require("../../services/notification.service");
const config_1 = require("@nestjs/config");
const payroll_exception_1 = require("../../domain/exceptions/payroll.exception");
const payroll_interface_1 = require("../../domain/interfaces/payroll.interface");
const crypto = __importStar(require("crypto"));
describe('PayrollService', () => {
    let service;
    let prisma;
    let storage;
    let queue;
    const mockPrisma = {
        payrollImport: {
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        payrollTemplate: {
            findFirst: jest.fn(),
        },
        servidor: {
            upsert: jest.fn(),
        },
        margem: {
            create: jest.fn(),
        },
        desconto: {
            create: jest.fn(),
        },
        contract: {
            findMany: jest.fn(),
        },
    };
    const mockStorage = {
        upload: jest.fn(),
        download: jest.fn(),
    };
    const mockQueue = {
        add: jest.fn(),
    };
    const mockNotification = {
        send: jest.fn(),
    };
    const mockConfig = {
        get: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                payroll_service_1.PayrollService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: storage_service_1.StorageService,
                    useValue: mockStorage,
                },
                {
                    provide: queue_service_1.QueueService,
                    useValue: mockQueue,
                },
                {
                    provide: notification_service_1.NotificationService,
                    useValue: mockNotification,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfig,
                },
            ],
        }).compile();
        service = module.get(payroll_service_1.PayrollService);
        prisma = module.get(prisma_service_1.PrismaService);
        storage = module.get(storage_service_1.StorageService);
        queue = module.get(queue_service_1.QueueService);
    });
    describe('importPayroll', () => {
        const mockFile = {
            originalname: 'folha.csv',
            buffer: Buffer.from('test'),
        };
        const mockTemplate = {
            id: 1,
            delimiter: ',',
            encoding: 'utf-8',
            skipLines: 1,
            columns: [],
        };
        beforeEach(() => {
            mockPrisma.payrollTemplate.findFirst.mockResolvedValue(mockTemplate);
            mockStorage.upload.mockResolvedValue(undefined);
            mockQueue.add.mockResolvedValue(undefined);
        });
        it('deve importar arquivo com sucesso', async () => {
            const result = await service.importPayroll(1, mockFile, '2025-02');
            expect(result).toBeDefined();
            expect(result.status).toBe(payroll_interface_1.PayrollStatus.PENDING);
            expect(queue.add).toHaveBeenCalledWith('process-payroll', expect.any(Object));
        });
        it('deve validar checksum do arquivo', async () => {
            const buffer = Buffer.from('test');
            const checksum = crypto
                .createHash('md5')
                .update(buffer)
                .digest('hex');
            await service.importPayroll(1, {
                ...mockFile,
                buffer,
                checksum,
            }, '2025-02');
            expect(storage.upload).toHaveBeenCalled();
        });
        it('deve falhar se template não encontrado', async () => {
            mockPrisma.payrollTemplate.findFirst.mockResolvedValue(null);
            await expect(service.importPayroll(1, mockFile, '2025-02')).rejects.toThrow(payroll_exception_1.PayrollImportException);
        });
    });
    describe('processPayroll', () => {
        const mockImport = {
            id: '1',
            consignanteId: 1,
            fileName: 'folha.csv',
            status: payroll_interface_1.PayrollStatus.PENDING,
            template: {
                delimiter: ',',
                encoding: 'utf-8',
                skipLines: 1,
                columns: [],
            },
        };
        const mockRecords = [
            {
                cpf: '12345678900',
                nome: 'João Silva',
                matricula: '123',
                salarioBruto: 5000,
                salarioLiquido: 4000,
                margemDisponivel: 1500,
                margemUtilizada: 500,
                descontos: [],
            },
        ];
        beforeEach(() => {
            mockPrisma.payrollImport.findUnique.mockResolvedValue(mockImport);
            mockStorage.download.mockResolvedValue(Buffer.from('test'));
        });
        it('deve processar registros com sucesso', async () => {
            await service.processPayroll('1');
            expect(prisma.servidor.upsert).toHaveBeenCalled();
            expect(prisma.margem.create).toHaveBeenCalled();
            expect(prisma.payrollImport.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    status: payroll_interface_1.PayrollStatus.COMPLETED,
                }),
            });
        });
        it('deve lidar com erros de processamento', async () => {
            mockPrisma.servidor.upsert.mockRejectedValue(new Error('DB Error'));
            await service.processPayroll('1');
            expect(prisma.payrollImport.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    status: payroll_interface_1.PayrollStatus.ERROR,
                }),
            });
        });
    });
    describe('reconcilePayroll', () => {
        const mockImport = {
            id: '1',
            consignanteId: 1,
            records: [
                {
                    descontos: [
                        { contratoId: '1', valor: 500 },
                    ],
                },
            ],
        };
        const mockContracts = [
            {
                id: '1',
                valorParcela: 500,
                status: 'ACTIVE',
            },
        ];
        beforeEach(() => {
            mockPrisma.payrollImport.findUnique.mockResolvedValue(mockImport);
            mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
        });
        it('deve reconciliar contratos com sucesso', async () => {
            const result = await service.reconcilePayroll('1');
            expect(result).toHaveLength(mockContracts.length);
            expect(result[0].status).toBe('MATCHED');
        });
        it('deve identificar divergências', async () => {
            mockImport.records[0].descontos[0].valor = 600;
            const result = await service.reconcilePayroll('1');
            expect(result[0].status).toBe('DIVERGENT');
            expect(result[0].difference).toBe(100);
        });
        it('deve notificar problemas', async () => {
            mockImport.records[0].descontos = [];
            await service.reconcilePayroll('1');
            expect(mockNotification.send).toHaveBeenCalledWith(expect.objectContaining({
                type: 'RECONCILIATION_ISSUE',
            }));
        });
    });
});
