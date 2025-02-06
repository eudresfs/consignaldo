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
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("../../services/auth.service");
const usuario_service_1 = require("../../services/usuario.service");
const logger_service_1 = require("../../infrastructure/logger/logger.service");
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
describe('AuthService', () => {
    let service;
    let usuarioService;
    let jwtService;
    const mockUsuario = {
        id: 1,
        email: 'test@example.com',
        senha: 'hashedPassword',
        nome: 'Test User',
        roles: ['ADMIN'],
        ativo: true,
        tentativasLogin: 0,
        bloqueadoAte: null,
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: usuario_service_1.UsuarioService,
                    useValue: {
                        findByEmail: jest.fn(),
                        resetLoginAttempts: jest.fn(),
                        updateLastAccess: jest.fn(),
                        blockUser: jest.fn(),
                        incrementLoginAttempts: jest.fn(),
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('test-token'),
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
        service = module.get(auth_service_1.AuthService);
        usuarioService = module.get(usuario_service_1.UsuarioService);
        jwtService = module.get(jwt_1.JwtService);
    });
    describe('login', () => {
        it('deve autenticar usuário com credenciais válidas', async () => {
            jest.spyOn(usuarioService, 'findByEmail').mockResolvedValue(mockUsuario);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            const result = await service.login('test@example.com', 'password');
            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('user');
            expect(result.user).toEqual({
                id: mockUsuario.id,
                nome: mockUsuario.nome,
                email: mockUsuario.email,
                roles: mockUsuario.roles,
            });
        });
        it('deve bloquear usuário após 5 tentativas falhas', async () => {
            const usuarioComTentativas = {
                ...mockUsuario,
                tentativasLogin: 4,
            };
            jest.spyOn(usuarioService, 'findByEmail').mockResolvedValue(usuarioComTentativas);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
            await expect(service.login('test@example.com', 'wrongpassword'))
                .rejects
                .toThrow(common_1.UnauthorizedException);
            expect(usuarioService.blockUser).toHaveBeenCalled();
        });
        it('deve rejeitar login de usuário inativo', async () => {
            const usuarioInativo = {
                ...mockUsuario,
                ativo: false,
            };
            jest.spyOn(usuarioService, 'findByEmail').mockResolvedValue(usuarioInativo);
            await expect(service.login('test@example.com', 'password'))
                .rejects
                .toThrow(common_1.UnauthorizedException);
        });
        it('deve rejeitar login de usuário bloqueado', async () => {
            const bloqueadoAte = new Date();
            bloqueadoAte.setHours(bloqueadoAte.getHours() + 1);
            const usuarioBloqueado = {
                ...mockUsuario,
                bloqueadoAte,
            };
            jest.spyOn(usuarioService, 'findByEmail').mockResolvedValue(usuarioBloqueado);
            await expect(service.login('test@example.com', 'password'))
                .rejects
                .toThrow(common_1.UnauthorizedException);
        });
    });
});
