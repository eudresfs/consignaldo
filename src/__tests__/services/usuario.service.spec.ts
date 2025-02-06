import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioService } from '../../services/usuario.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../../domain/enums/role.enum';
import * as bcrypt from 'bcrypt';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let prisma: PrismaService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        {
          provide: PrismaService,
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
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findById', () => {
    it('deve retornar usuário por ID com roles', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(mockUsuario);

      const result = await service.findById(1);

      expect(result).toHaveProperty('roles');
      expect(result.roles).toContain(Role.CONSIGNATARIA);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      jest.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(999))
        .rejects
        .toThrow(NotFoundException);
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
