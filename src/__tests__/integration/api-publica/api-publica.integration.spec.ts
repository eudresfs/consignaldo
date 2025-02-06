import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { StatusIntegracao } from '../../../domain/api-publica/api-publica.types';
import { createTestUser, createTestToken } from '../../test-utils/auth';

describe('ApiPublica (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let suporteToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Criar usuário admin e gerar token
    const adminUser = await createTestUser(prisma, { role: 'ADMIN' });
    userId = adminUser.id;
    adminToken = await createTestToken(app, adminUser);

    // Criar usuário suporte e gerar token
    const suporteUser = await createTestUser(prisma, { role: 'SUPORTE' });
    suporteToken = await createTestToken(app, suporteUser);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('/api-publica', () => {
    let apiKeyId: string;
    let webhookId: string;

    describe('POST /api-publica/api-keys', () => {
      it('deve criar API Key com sucesso (ADMIN)', async () => {
        const response = await request(app.getHttpServer())
          .post('/api-publica/api-keys')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: 'Test API Key',
            clienteId: '123',
            permissoes: ['READ', 'WRITE'],
            limitesUso: {
              requisicoesPorMinuto: 60,
              requisicoesPorHora: 1000,
              requisicoesPorDia: 10000,
              requisicoesConcorrentes: 5
            }
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('chave');
        expect(response.body.status).toBe(StatusIntegracao.ATIVO);

        apiKeyId = response.body.id;
      });

      it('deve rejeitar criação sem permissão (SUPORTE)', async () => {
        const response = await request(app.getHttpServer())
          .post('/api-publica/api-keys')
          .set('Authorization', `Bearer ${suporteToken}`)
          .send({
            nome: 'Test API Key',
            clienteId: '123',
            permissoes: ['READ']
          });

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api-publica/api-keys/:id/webhooks', () => {
      it('deve configurar webhook com sucesso (ADMIN)', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api-publica/api-keys/${apiKeyId}/webhooks`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            url: 'https://test.com/webhook',
            eventos: ['CONTRATO_CRIADO', 'CONTRATO_APROVADO'],
            ativo: true,
            tentativasMaximas: 3,
            intervalosRetentativa: [60, 300, 900]
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.url).toBe('https://test.com/webhook');

        webhookId = response.body.id;
      });

      it('deve validar URL do webhook', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api-publica/api-keys/${apiKeyId}/webhooks`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            url: 'invalid-url',
            eventos: ['CONTRATO_CRIADO'],
            ativo: true,
            tentativasMaximas: 3,
            intervalosRetentativa: [60]
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api-publica/logs', () => {
      beforeEach(async () => {
        // Criar alguns logs para teste
        await prisma.logIntegracao.createMany({
          data: [
            {
              apiKeyId,
              endpoint: '/test',
              metodo: 'GET',
              statusCode: 200,
              tempoResposta: 100,
              ip: '127.0.0.1',
              userAgent: 'test-agent'
            },
            {
              apiKeyId,
              endpoint: '/test',
              metodo: 'POST',
              statusCode: 400,
              tempoResposta: 150,
              ip: '127.0.0.1',
              userAgent: 'test-agent'
            }
          ]
        });
      });

      it('deve listar logs com paginação (ADMIN)', async () => {
        const response = await request(app.getHttpServer())
          .get('/api-publica/logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            pagina: 1,
            itensPorPagina: 10
          });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);
        expect(response.body.total).toBe(2);
      });

      it('deve filtrar logs por status code (SUPORTE)', async () => {
        const response = await request(app.getHttpServer())
          .get('/api-publica/logs')
          .set('Authorization', `Bearer ${suporteToken}`)
          .query({
            statusCode: 400
          });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].statusCode).toBe(400);
      });
    });

    describe('GET /api-publica/api-keys/:id/metricas', () => {
      it('deve retornar métricas de uso (ADMIN)', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api-publica/api-keys/${apiKeyId}/metricas`)
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ periodo: 'dia' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('requisicoes');
        expect(response.body).toHaveProperty('erros');
        expect(response.body).toHaveProperty('tempoMedioResposta');
      });

      it('deve validar período inválido', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api-publica/api-keys/${apiKeyId}/metricas`)
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ periodo: 'invalid' });

        expect(response.status).toBe(400);
      });
    });
  });
});
