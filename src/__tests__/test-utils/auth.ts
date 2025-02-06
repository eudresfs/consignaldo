import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export async function createTestUser(prisma: PrismaService) {
  const hashedPassword = await bcrypt.hash('test123', 10);
  return prisma.usuario.create({
    data: {
      nome: 'Test User',
      email: 'test@example.com',
      senha: hashedPassword,
      ativo: true,
      perfil: 'ADMIN'
    }
  });
}

export async function createTestToken(app: INestApplication, user: any) {
  const jwtService = app.get(JwtService);
  return jwtService.sign({ 
    sub: user.id,
    email: user.email,
    perfil: user.perfil
  });
}
