import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';

export class IntegrationTestManager {
  private app: INestApplication;
  private prisma: PrismaService;
  private config: ConfigService;

  async init(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.prisma = this.app.get<PrismaService>(PrismaService);
    this.config = this.app.get<ConfigService>(ConfigService);

    await this.app.init();
  }

  async cleanup(): Promise<void> {
    // Limpa dados de teste
    await this.prisma.$transaction([
      this.prisma.payrollImport.deleteMany(),
      this.prisma.contract.deleteMany(),
      this.prisma.proposal.deleteMany(),
      this.prisma.servidor.deleteMany(),
    ]);

    await this.app.close();
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }

  getPrisma() {
    return this.prisma;
  }

  getConfig() {
    return this.config;
  }

  // Helpers para criar dados de teste
  async createServidor() {
    return this.prisma.servidor.create({
      data: {
        cpf: '12345678900',
        nome: 'João Teste',
        matricula: '123456',
        salarioBruto: 5000,
        salarioLiquido: 4000,
      },
    });
  }

  async createConsignataria() {
    return this.prisma.consignataria.create({
      data: {
        nome: 'Banco Teste',
        codigo: 'BT',
        taxaJuros: 1.99,
        status: 'ACTIVE',
      },
    });
  }

  async createProduto(consignatariaId: number) {
    return this.prisma.loanProduct.create({
      data: {
        consignatariaId,
        nome: 'Crédito Pessoal',
        prazoMinimo: 12,
        prazoMaximo: 96,
        valorMinimo: 5000,
        valorMaximo: 50000,
        taxaJuros: 1.99,
        taxaIof: 0.38,
        status: 'ACTIVE',
      },
    });
  }

  async createMargem(servidorId: number) {
    return this.prisma.margem.create({
      data: {
        servidorId,
        competencia: '2025-02',
        disponivel: 1500,
        utilizada: 500,
      },
    });
  }
}
