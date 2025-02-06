import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { StatusRefinanciamento } from '../../../domain/refinanciamento/refinanciamento.types';
import { createTestUser, createTestToken } from '../../test-utils/auth';
import { 
  createTestContrato,
  createTestServidor,
  createTestBanco 
} from '../../test-utils/fixtures';

describe('Refinanciamento (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Criar usuário de teste e gerar token
    const user = await createTestUser(prisma);
    userId = user.id;
    token = await createTestToken(app, user);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('/refinanciamento', () => {
    let contratoId: string;
    let servidorId: number;
    let bancoId: number;

    beforeEach(async () => {
      // Criar dados de teste
      const servidor = await createTestServidor(prisma);
      servidorId = servidor.id;

      const banco = await createTestBanco(prisma, { nome: 'Banco Teste' });
      bancoId = banco.id;

      const contrato = await createTestContrato(prisma, {
        servidorId,
        bancoId,
        valorParcela: 500,
        taxaJuros: 2.5,
        parcelasPagas: 6,
        prazoTotal: 24
      });
      contratoId = contrato.id;
    });

    describe('POST /refinanciamento/simular', () => {
      it('deve simular refinanciamento com sucesso', async () => {
        const response = await request(app.getHttpServer())
          .post('/refinanciamento/simular')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoId,
            valorContrato: 10000,
            valorParcela: 500,
            taxaJuros: 2.5,
            prazoTotal: 24,
            parcelasPagas: 6,
            saldoDevedor: 8000
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('economia');
        expect(response.body.economia).toHaveProperty('economiaTotal');
        expect(response.body.economia).toHaveProperty('economiaMensal');
      });

      it('deve rejeitar simulação com parcelas insuficientes', async () => {
        const response = await request(app.getHttpServer())
          .post('/refinanciamento/simular')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoId,
            valorContrato: 10000,
            valorParcela: 500,
            taxaJuros: 2.5,
            prazoTotal: 24,
            parcelasPagas: 3,
            saldoDevedor: 8000
          });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /refinanciamento', () => {
      it('deve criar refinanciamento com sucesso', async () => {
        const response = await request(app.getHttpServer())
          .post('/refinanciamento')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoId,
            bancoId,
            servidorId,
            valorContrato: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            taxaJurosNova: 2.2,
            prazoTotal: 24,
            parcelasPagas: 6,
            saldoDevedor: 8000,
            documentos: ['base64-encoded-doc']
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe(StatusRefinanciamento.AGUARDANDO_ANALISE);
      });

      it('deve rejeitar criação sem documentos', async () => {
        const response = await request(app.getHttpServer())
          .post('/refinanciamento')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoId,
            bancoId,
            servidorId,
            valorContrato: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            taxaJurosNova: 2.2,
            prazoTotal: 24,
            parcelasPagas: 6,
            saldoDevedor: 8000
          });

        expect(response.status).toBe(400);
      });
    });

    describe('PATCH /refinanciamento/:id/analisar', () => {
      let refinanciamentoId: string;

      beforeEach(async () => {
        // Criar refinanciamento para teste
        const refinanciamento = await prisma.refinanciamento.create({
          data: {
            contratoId,
            bancoId,
            servidorId,
            usuarioId: userId,
            valorContrato: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            taxaJurosNova: 2.2,
            prazoTotal: 24,
            parcelasPagas: 6,
            saldoDevedor: 8000,
            status: StatusRefinanciamento.AGUARDANDO_ANALISE,
            protocoloBanco: 'TEST123',
            metadata: {}
          }
        });
        refinanciamentoId = refinanciamento.id;
      });

      it('deve analisar refinanciamento com sucesso', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/refinanciamento/${refinanciamentoId}/analisar`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            status: StatusRefinanciamento.APROVADO
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(StatusRefinanciamento.APROVADO);
      });

      it('deve rejeitar análise com status inválido', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/refinanciamento/${refinanciamentoId}/analisar`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            status: 'STATUS_INVALIDO'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /refinanciamento', () => {
      beforeEach(async () => {
        // Criar alguns refinanciamentos para teste
        await Promise.all([
          prisma.refinanciamento.create({
            data: {
              contratoId,
              bancoId,
              servidorId,
              usuarioId: userId,
              valorContrato: 10000,
              valorParcela: 500,
              taxaJurosAtual: 2.5,
              taxaJurosNova: 2.2,
              prazoTotal: 24,
              parcelasPagas: 6,
              saldoDevedor: 8000,
              status: StatusRefinanciamento.AGUARDANDO_ANALISE,
              protocoloBanco: 'TEST1',
              metadata: {}
            }
          }),
          prisma.refinanciamento.create({
            data: {
              contratoId,
              bancoId,
              servidorId,
              usuarioId: userId,
              valorContrato: 15000,
              valorParcela: 700,
              taxaJurosAtual: 2.8,
              taxaJurosNova: 2.5,
              prazoTotal: 30,
              parcelasPagas: 8,
              saldoDevedor: 12000,
              status: StatusRefinanciamento.APROVADO,
              protocoloBanco: 'TEST2',
              metadata: {}
            }
          })
        ]);
      });

      it('deve listar refinanciamentos com paginação', async () => {
        const response = await request(app.getHttpServer())
          .get('/refinanciamento')
          .set('Authorization', `Bearer ${token}`)
          .query({
            page: 1,
            limit: 10
          });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);
        expect(response.body.total).toBe(2);
        expect(response.body.page).toBe(1);
      });

      it('deve filtrar refinanciamentos por status', async () => {
        const response = await request(app.getHttpServer())
          .get('/refinanciamento')
          .set('Authorization', `Bearer ${token}`)
          .query({
            status: StatusRefinanciamento.APROVADO
          });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].status).toBe(StatusRefinanciamento.APROVADO);
      });
    });
  });
});
