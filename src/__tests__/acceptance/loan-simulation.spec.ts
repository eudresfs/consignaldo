import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { setupApp } from '../setup';

describe('Simulação de Empréstimo (Acceptance)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    setupApp(app);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cenário: Simulação de Novo Empréstimo', () => {
    it('Dado um servidor com margem disponível, quando solicitar simulação, deve retornar opções válidas', async () => {
      // Arrange
      const servidor = await prisma.servidor.create({
        data: {
          nome: 'João Silva',
          cpf: '12345678900',
          matricula: '123456',
          salarioBruto: 5000,
          margemDisponivel: 1500, // 30% do salário
        },
      });

      const consignataria = await prisma.consignataria.create({
        data: {
          nome: 'Banco Teste',
          codigo: 'TST',
          taxaJuros: 1.99,
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/loan-simulation')
        .send({
          servidorId: servidor.id,
          consignatariaId: consignataria.id,
          valorSolicitado: 10000,
          prazo: 24,
        })
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        valorSolicitado: 10000,
        prazo: 24,
        taxaJuros: 1.99,
        valorParcela: expect.any(Number),
        cet: expect.any(Number),
        iof: expect.any(Number),
      });

      expect(response.body.valorParcela).toBeLessThanOrEqual(1500); // Dentro da margem
      expect(response.body.parcelas).toHaveLength(24);
    });

    it('Dado um servidor sem margem, quando solicitar simulação, deve retornar erro', async () => {
      // Arrange
      const servidor = await prisma.servidor.create({
        data: {
          nome: 'João Silva',
          cpf: '12345678900',
          matricula: '123456',
          salarioBruto: 5000,
          margemDisponivel: 0,
        },
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/loan-simulation')
        .send({
          servidorId: servidor.id,
          valorSolicitado: 10000,
          prazo: 24,
        })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBe('MargemInsuficiente');
        });
    });
  });

  describe('Cenário: Simulação de Refinanciamento', () => {
    it('Dado um contrato ativo, quando solicitar refinanciamento, deve calcular economia', async () => {
      // Arrange
      const servidor = await prisma.servidor.create({
        data: {
          nome: 'João Silva',
          cpf: '12345678900',
          matricula: '123456',
          salarioBruto: 5000,
          margemDisponivel: 1500,
        },
      });

      const contrato = await prisma.contrato.create({
        data: {
          servidorId: servidor.id,
          valor: 10000,
          prazo: 24,
          parcela: 500,
          taxaJuros: 2.5,
          status: 'AVERBADO',
          saldoDevedor: 8000,
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/loan-simulation/refinance')
        .send({
          contratoId: contrato.id,
          valorSolicitado: 12000,
          prazo: 36,
        })
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        valorSolicitado: 12000,
        prazo: 36,
        taxaJuros: expect.any(Number),
        valorParcela: expect.any(Number),
        saldoDevedor: 8000,
        valorLiquidacao: expect.any(Number),
        valorDisponivel: expect.any(Number),
        economiaTotal: expect.any(Number),
      });

      expect(response.body.valorParcela).toBeLessThan(500); // Parcela menor que a atual
      expect(response.body.economiaTotal).toBeGreaterThan(0);
    });
  });

  describe('Cenário: Simulação de Portabilidade', () => {
    it('Dado um contrato em outro banco, quando solicitar portabilidade, deve calcular economia', async () => {
      // Arrange
      const servidor = await prisma.servidor.create({
        data: {
          nome: 'João Silva',
          cpf: '12345678900',
          matricula: '123456',
          salarioBruto: 5000,
          margemDisponivel: 1500,
        },
      });

      const contratoOrigem = await prisma.contrato.create({
        data: {
          servidorId: servidor.id,
          valor: 10000,
          prazo: 24,
          parcela: 500,
          taxaJuros: 2.5,
          status: 'AVERBADO',
          saldoDevedor: 8000,
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/loan-simulation/portability')
        .send({
          contratoOrigemId: contratoOrigem.id,
          bancoOrigemId: 1,
          prazo: 24,
        })
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        valorSolicitado: 8000, // Saldo devedor
        prazo: 24,
        taxaJuros: expect.any(Number),
        valorParcela: expect.any(Number),
        saldoDevedor: 8000,
        valorPresenteParcelas: expect.any(Number),
        economiaTotal: expect.any(Number),
      });

      expect(response.body.valorParcela).toBeLessThan(500); // Parcela menor que a atual
      expect(response.body.economiaTotal).toBeGreaterThan(0);
    });
  });

  describe('Cenário: Performance e Carga', () => {
    it('Deve suportar múltiplas simulações simultâneas', async () => {
      // Arrange
      const servidor = await prisma.servidor.create({
        data: {
          nome: 'João Silva',
          cpf: '12345678900',
          matricula: '123456',
          salarioBruto: 5000,
          margemDisponivel: 1500,
        },
      });

      // Act
      const promises = Array(10).fill(0).map(() =>
        request(app.getHttpServer())
          .post('/api/loan-simulation')
          .send({
            servidorId: servidor.id,
            valorSolicitado: 10000,
            prazo: 24,
          })
      );

      // Assert
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('valorParcela');
      });
    });
  });
});
