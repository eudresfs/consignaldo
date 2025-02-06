import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usuarioService: UsuarioService;
  let jwtService: JwtService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsuarioService,
          useValue: {
            findByEmail: jest.fn(),
            resetLoginAttempts: jest.fn(),
            updateLastAccess: jest.fn(),
            blockUser: jest.fn(),
            incrementLoginAttempts: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuarioService = module.get<UsuarioService>(UsuarioService);
    jwtService = module.get<JwtService>(JwtService);
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
        .toThrow(UnauthorizedException);

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
        .toThrow(UnauthorizedException);
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
        .toThrow(UnauthorizedException);
    });
  });
});
