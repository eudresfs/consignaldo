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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const usuario_service_1 = require("./usuario.service");
const bcrypt_1 = require("bcrypt");
const logger_service_1 = require("../infrastructure/logger/logger.service");
let AuthService = class AuthService {
    constructor(usuarioService, jwtService, logger) {
        this.usuarioService = usuarioService;
        this.jwtService = jwtService;
        this.logger = logger;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.BLOCK_DURATION = 30; // minutos
    }
    async login(email, senha) {
        const usuario = await this.usuarioService.findByEmail(email);
        if (!usuario) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        if (!usuario.ativo) {
            throw new common_1.UnauthorizedException('Usuário inativo');
        }
        if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
            throw new common_1.UnauthorizedException(`Usuário bloqueado até ${usuario.bloqueadoAte}`);
        }
        const senhaValida = await (0, bcrypt_1.compare)(senha, usuario.senha);
        if (!senhaValida) {
            await this.handleFailedLogin(usuario);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        // Reset tentativas após login bem-sucedido
        if (usuario.tentativasLogin > 0) {
            await this.usuarioService.resetLoginAttempts(usuario.id);
        }
        // Atualiza último acesso
        await this.usuarioService.updateLastAccess(usuario.id);
        this.logger.log('Login bem-sucedido', 'AuthService', { userId: usuario.id });
        return {
            access_token: this.jwtService.sign({
                sub: usuario.id,
                email: usuario.email,
                roles: usuario.roles,
            }),
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                roles: usuario.roles,
                vinculoAtual: usuario.vinculoAtual,
            },
        };
    }
    async handleFailedLogin(usuario) {
        const tentativas = usuario.tentativasLogin + 1;
        if (tentativas >= this.MAX_LOGIN_ATTEMPTS) {
            const bloqueadoAte = new Date();
            bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + this.BLOCK_DURATION);
            await this.usuarioService.blockUser(usuario.id, bloqueadoAte);
            this.logger.warn(`Usuário bloqueado por excesso de tentativas`, 'AuthService', { userId: usuario.id, bloqueadoAte });
        }
        else {
            await this.usuarioService.incrementLoginAttempts(usuario.id);
            this.logger.warn(`Tentativa de login falha`, 'AuthService', { userId: usuario.id, tentativas });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [usuario_service_1.UsuarioService,
        jwt_1.JwtService,
        logger_service_1.LoggerService])
], AuthService);
