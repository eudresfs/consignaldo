import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type PrismaModels = {
  [M in keyof PrismaClient]: PrismaClient[M] extends { deleteMany: any } ? M : never;
}[keyof PrismaClient];

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      const models = {
        usuario: this.usuario,
        funcionario: this.funcionario,
        produto: this.produto,
        empresa: this.empresa,
        averbacao: this.averbacao,
        perfil: this.perfil,
        consignataria: this.consignataria,
        consignante: this.consignante,
        vinculo: this.vinculo,
        usuarioVinculo: this.usuarioVinculo,
        usuarioHistorico: this.usuarioHistorico
      };
  
      return Promise.all(
        Object.values(models).map(model => model.deleteMany())
      );
    }
  }
}