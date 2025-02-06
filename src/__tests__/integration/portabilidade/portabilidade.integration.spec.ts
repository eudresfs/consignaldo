import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { StatusPortabilidade } from '../../../domain/portabilidade/portabilidade.types';
import { createTestUser, createTestToken } from '../../test-utils/auth';
import { 
  createTestContrato,
  createTestServidor,
  createTestBanco 
} from '../../test-utils/fixtures';

describe('Portabilidade (e2e)', () => {
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

  describe('/portabilidade', () => {
    let contratoId: string;
    let servidorId: number;
    let bancoOrigemId: number;
    let bancoDestinoId: number;

    beforeEach(async () => {
      // Criar dados de teste
      const servidor = await createTestServidor(prisma);
      servidorId = servidor.id;

      const bancoOrigem = await createTestBanco(prisma, { nome: 'Banco Origem' });
      bancoOrigemId = bancoOrigem.id;

      const bancoDestino = await createTestBanco(prisma, { nome: 'Banco Destino' });
      bancoDestinoId = bancoDestino.id;

      const contrato = await createTestContrato(prisma, {
        servidorId,
        bancoId: bancoOrigemId,
        valorParcela: 500,
        taxaJuros: 2.5,
        parcelasPagas: 12,
        prazoTotal: 36
      });
      contratoId = contrato.id;
    });

    describe('POST /portabilidade/simular', () => {
      it('deve simular portabilidade com sucesso', async () => {
        const response = await request(app.getHttpServer())
          .post('/portabilidade/simular')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoOrigemId: contratoId,
            valorSaldoDevedor: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            prazoRestante: 24,
            prazoTotal: 36,
            parcelasPagas: 12
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('economia');
        expect(response.body.economia).toHaveProperty('economiaTotal');
        expect(response.body.economia).toHaveProperty('economiaMensal');
      });

      it('deve rejeitar simulação com parcelas insuficientes', async () => {
        const response = await request(app.getHttpServer())
          .post('/portabilidade/simular')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoOrigemId: contratoId,
            valorSaldoDevedor: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            prazoRestante: 24,
            prazoTotal: 36,
            parcelasPagas: 6
          });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /portabilidade', () => {
      it('deve criar portabilidade com sucesso', async () => {
        const response = await request(app.getHttpServer())
          .post('/portabilidade')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoOrigemId: contratoId,
            bancoOrigemId,
            bancoDestinoId,
            servidorId,
            valorSaldoDevedor: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            taxaJurosNova: 1.8,
            prazoRestante: 24,
            prazoTotal: 36,
            parcelasPagas: 12,
            documentos: ['base64-encoded-doc']
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe(StatusPortabilidade.AGUARDANDO_ANALISE);
      });

      it('deve rejeitar criação sem documentos', async () => {
        const response = await request(app.getHttpServer())
          .post('/portabilidade')
          .set('Authorization', `Bearer ${token}`)
          .send({
            contratoOrigemId: contratoId,
            bancoOrigemId,
            bancoDestinoId,
            servidorId,
            valorSaldoDevedor: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            taxaJurosNova: 1.8,
            prazoRestante: 24,
            prazoTotal: 36,
            parcelasPagas: 12
          });

        expect(response.status).toBe(400);
      });
    });

    describe('PATCH /portabilidade/:id/analisar', () => {
      let portabilidadeId: string;

      beforeEach(async () => {
        // Criar portabilidade para teste
        const portabilidade = await prisma.portabilidade.create({
          data: {
            contratoOrigemId: contratoId,
            bancoOrigemId,
            bancoDestinoId,
            servidorId,
            usuarioId: userId,
            valorSaldoDevedor: 10000,
            valorParcela: 500,
            taxaJurosAtual: 2.5,
            taxaJurosNova: 1.8,
            prazoRestante: 24,
            prazoTotal: 36,
            status: StatusPortabilidade.AGUARDANDO_ANALISE,
            protocoloBanco: 'TEST123'
          }
        });
        portabilidadeId = portabilidade.id;
      });

      it('deve analisar portabilidade com sucesso', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/portabilidade/${portabilidadeId}/analisar`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            status: StatusPortabilidade.APROVADA
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(StatusPortabilidade.APROVADA);
      });

      it('deve rejeitar análise com status inválido', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/portabilidade/${portabilidadeId}/analisar`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            status: 'STATUS_INVALIDO'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /portabilidade', () => {
      beforeEach(async () => {
        // Criar algumas portabilidades para teste
        await Promise.all([
          prisma.portabilidade.create({
            data: {
              contratoOrigemId: contratoId,
              bancoOrigemId,
              bancoDestinoId,
              servidorId,
              usuarioId: userId,
              valorSaldoDevedor: 10000,
              valorParcela: 500,
              taxaJurosAtual: 2.5,
              taxaJurosNova: 1.8,
              prazoRestante: 24,
              prazoTotal: 36,
              status: StatusPortabilidade.AGUARDANDO_ANALISE,
              protocoloBanco: 'TEST1'
            }
          }),
          prisma.portabilidade.create({
            data: {
              contratoOrigemId: contratoId,
              bancoOrigemId,
              bancoDestinoId,
              servidorId,
              usuarioId: userId,
              valorSaldoDevedor: 15000,
              valorParcela: 700,
              taxaJurosAtual: 2.8,
              taxaJurosNova: 2.0,
              prazoRestante: 30,
              prazoTotal: 48,
              status: StatusPortabilidade.APROVADA,
              protocoloBanco: 'TEST2'
            }
          })
        ]);
      });

      it('deve listar portabilidades com paginação', async () => {
        const response = await request(app.getHttpServer())
          .get('/portabilidade')
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

      it('deve filtrar portabilidades por status', async () => {
        const response = await request(app.getHttpServer())
          .get('/portabilidade')
          .set('Authorization', `Bearer ${token}`)
          .query({
            status: StatusPortabilidade.APROVADA
          });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].status).toBe(StatusPortabilidade.APROVADA);
      });
    });
  });
});
