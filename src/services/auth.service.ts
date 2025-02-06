import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from './usuario.service';
import { compare } from 'bcrypt';
import { LoggerService } from '../infrastructure/logger/logger.service';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly BLOCK_DURATION = 30; // minutos

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async login(email: string, senha: string) {
    const usuario = await this.usuarioService.findByEmail(email);

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      throw new UnauthorizedException(`Usuário bloqueado até ${usuario.bloqueadoAte}`);
    }

    const senhaValida = await compare(senha, usuario.senha);

    if (!senhaValida) {
      await this.handleFailedLogin(usuario);
      throw new UnauthorizedException('Credenciais inválidas');
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

  private async handleFailedLogin(usuario: any) {
    const tentativas = usuario.tentativasLogin + 1;
    
    if (tentativas >= this.MAX_LOGIN_ATTEMPTS) {
      const bloqueadoAte = new Date();
      bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + this.BLOCK_DURATION);
      
      await this.usuarioService.blockUser(usuario.id, bloqueadoAte);
      
      this.logger.warn(
        `Usuário bloqueado por excesso de tentativas`,
        'AuthService',
        { userId: usuario.id, bloqueadoAte }
      );
    } else {
      await this.usuarioService.incrementLoginAttempts(usuario.id);
      
      this.logger.warn(
        `Tentativa de login falha`,
        'AuthService',
        { userId: usuario.id, tentativas }
      );
    }
  }
}