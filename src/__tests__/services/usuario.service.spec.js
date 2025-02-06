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
const usuario_service_1 = require("../../services/usuario.service");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../../infrastructure/logger/logger.service");
const common_1 = require("@nestjs/common");
const role_enum_1 = require("../../domain/enums/role.enum");
const bcrypt = __importStar(require("bcrypt"));
describe('UsuarioService', () => {
    let service;
    let prisma;
    const mockUsuario = {
        id: 1,
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'hashedPassword',
        ativo: true,
        tentativasLogin: 0,
        bloqueadoAte: null,
        usuarioVinculo: [
            {
                id: 1,
                ativo: true,
                vinculo: {
                    id: 1,
                    tipo: 'CONSIGNATARIA',
                },
            },
        ],
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                usuario_service_1.UsuarioService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        usuario: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        usuarioVinculo: {
                            create: jest.fn(),
                        },
                    },
                },
                {
                    provide: logger_service_1.LoggerService,
                    useValue: {
                        log: jest.fn(),
                        warn: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(usuario_service_1.UsuarioService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    describe('findById', () => {
        it('deve retornar usuário por ID com roles', async () => {
            jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUsuario);
            const result = await service.findById(1);
            expect(result).toHaveProperty('roles');
            expect(result.roles).toContain(role_enum_1.Role.CONSIGNATARIA);
        });
        it('deve lançar NotFoundException quando usuário não existe', async () => {
            jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
            await expect(service.findById(999))
                .rejects
                .toThrow(common_1.NotFoundException);
        });
    });
    describe('create', () => {
        it('deve criar usuário com senha hash', async () => {
            const createData = {
                nome: 'New User',
                email: 'new@example.com',
                senha: 'password123',
            };
            const hashedPassword = 'hashedPassword123';
            jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));
            jest.spyOn(prisma.usuario, 'create').mockResolvedValue({
                ...createData,
                id: 1,
                senha: hashedPassword,
                ativo: true,
                tentativasLogin: 0,
            });
            const result = await service.create(createData);
            expect(prisma.usuario.create).toHaveBeenCalledWith({
                data: {
                    nome: createData.nome,
                    email: createData.email,
                    senha: hashedPassword,
                    ativo: true,
                    tentativasLogin: 0,
                },
            });
            expect(result).toHaveProperty('id');
            expect(result.senha).toBe(hashedPassword);
        });
        it('deve criar usuário com vínculo quando vinculoId é fornecido', async () => {
            const createData = {
                nome: 'New User',
                email: 'new@example.com',
                senha: 'password123',
                vinculoId: 1,
            };
            jest.spyOn(prisma.usuario, 'create').mockResolvedValue({
                ...createData,
                id: 1,
                senha: 'hashedPassword',
                ativo: true,
                tentativasLogin: 0,
            });
            await service.create(createData);
            expect(prisma.usuarioVinculo.create).toHaveBeenCalledWith({
                data: {
                    usuarioId: 1,
                    vinculoId: createData.vinculoId,
                    ativo: true,
                },
            });
        });
    });
    describe('blockUser', () => {
        it('deve bloquear usuário até data específica', async () => {
            const userId = 1;
            const bloqueadoAte = new Date();
            await service.blockUser(userId, bloqueadoAte);
            expect(prisma.usuario.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    bloqueadoAte,
                    tentativasLogin: 0,
                },
            });
        });
    });
});
