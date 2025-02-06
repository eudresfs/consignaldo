import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { hash } from 'bcrypt';
import { Role } from '../domain/enums/role.enum';
import { LoggerService } from '../infrastructure/logger/logger.service';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findById(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        usuarioVinculo: {
          where: { ativo: true },
          include: { vinculo: true },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário #${id} não encontrado`);
    }

    return {
      ...usuario,
      roles: this.getRolesFromVinculos(usuario.usuarioVinculo),
    };
  }

  async findByEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        usuarioVinculo: {
          where: { ativo: true },
          include: { vinculo: true },
        },
      },
    });

    if (!usuario) {
      return null;
    }

    return {
      ...usuario,
      roles: this.getRolesFromVinculos(usuario.usuarioVinculo),
    };
  }

  async create(data: {
    nome: string;
    email: string;
    senha: string;
    vinculoId?: number;
  }) {
    const senhaHash = await hash(data.senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        ativo: true,
        tentativasLogin: 0,
      },
    });

    if (data.vinculoId) {
      await this.prisma.usuarioVinculo.create({
        data: {
          usuarioId: usuario.id,
          vinculoId: data.vinculoId,
          ativo: true,
        },
      });
    }

    this.logger.log(
      'Usuário criado com sucesso',
      'UsuarioService',
      { userId: usuario.id }
    );

    return usuario;
  }

  async resetLoginAttempts(id: number) {
    await this.prisma.usuario.update({
      where: { id },
      data: {
        tentativasLogin: 0,
        bloqueadoAte: null,
      },
    });
  }

  async incrementLoginAttempts(id: number) {
    await this.prisma.usuario.update({
      where: { id },
      data: {
        tentativasLogin: {
          increment: 1,
        },
      },
    });
  }

  async blockUser(id: number, bloqueadoAte: Date) {
    await this.prisma.usuario.update({
      where: { id },
      data: {
        bloqueadoAte,
        tentativasLogin: 0,
      },
    });
  }

  async updateLastAccess(id: number) {
    await this.prisma.usuario.update({
      where: { id },
      data: {
        ultimoAcesso: new Date(),
      },
    });
  }

  private getRolesFromVinculos(vinculos: any[]): Role[] {
    const roles = new Set<Role>();
    
    // Admin tem acesso total
    if (vinculos.some(v => v.vinculo.tipo === 'ADMIN')) {
      roles.add(Role.ADMIN);
    }
    
    // Mapeia tipos de vínculo para roles
    vinculos.forEach(v => {
      switch (v.vinculo.tipo) {
        case 'CONSIGNATARIA':
          roles.add(Role.CONSIGNATARIA);
          break;
        case 'CONSIGNANTE':
          roles.add(Role.CONSIGNANTE);
          break;
        case 'SERVIDOR':
          roles.add(Role.SERVIDOR);
          break;
        case 'OPERADOR':
          roles.add(Role.OPERADOR);
          break;
      }
    });

    return Array.from(roles);
  }
}