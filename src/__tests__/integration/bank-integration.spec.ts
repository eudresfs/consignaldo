import { IntegrationTestManager } from './setup';
import { BankApiMock } from './mocks/bank-api.mock';
import * as request from 'supertest';

describe('Integração com Bancos (E2E)', () => {
  let testManager: IntegrationTestManager;
  let bankApiMock: BankApiMock;
  let consignataria: any;

  beforeAll(async () => {
    testManager = new IntegrationTestManager();
    bankApiMock = new BankApiMock();
    await testManager.init();
    bankApiMock.setupMocks();
  });

  beforeEach(async () => {
    consignataria = await testManager.createConsignataria();
  });

  afterAll(async () => {
    await testManager.cleanup();
    bankApiMock.cleanupMocks();
  });

  describe('Importação de Propostas', () => {
    it('deve importar propostas com sucesso', async () => {
      const response = await request(testManager.getHttpServer())
        .post(`/bank-integration/import/${consignataria.id}`)
        .expect(201);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', '1');
    });

    it('deve lidar com timeout', async () => {
      bankApiMock.mockTimeout();

      const response = await request(testManager.getHttpServer())
        .post(`/bank-integration/import/${consignataria.id}`)
        .expect(408);

      expect(response.body.code).toBe('BANK_TIMEOUT');
    });

    it('deve lidar com erro de rede', async () => {
      bankApiMock.mockNetworkError();

      const response = await request(testManager.getHttpServer())
        .post(`/bank-integration/import/${consignataria.id}`)
        .expect(503);

      expect(response.body.code).toBe('BANK_UNAVAILABLE');
    });
  });

  describe('Webhooks', () => {
    it('deve processar webhook de aprovação', async () => {
      // Cria proposta
      const proposta = await testManager.getPrisma().proposal.create({
        data: {
          servidorId: 1,
          consignatariaId: consignataria.id,
          valorSolicitado: 10000,
          prazo: 24,
          status: 'PENDING',
        },
      });

      // Simula webhook de aprovação
      await request(testManager.getHttpServer())
        .post(`/bank-integration/webhook/${consignataria.id}`)
        .send({
          event: 'PROPOSAL_UPDATED',
          data: {
            id: proposta.id,
            status: 'APPROVED',
          },
          timestamp: new Date(),
          signature: 'valid-signature',
        })
        .expect(200);

      // Verifica atualização
      const propostaAtualizada = await testManager.getPrisma().proposal.findUnique({
        where: { id: proposta.id },
      });

      expect(propostaAtualizada.status).toBe('APPROVED');
    });

    it('deve validar assinatura do webhook', async () => {
      const response = await request(testManager.getHttpServer())
        .post(`/bank-integration/webhook/${consignataria.id}`)
        .send({
          event: 'PROPOSAL_UPDATED',
          data: {},
          timestamp: new Date(),
          signature: 'invalid-signature',
        })
        .expect(401);

      expect(response.body.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });
  });

  describe('Métricas', () => {
    it('deve registrar tempo de resposta do banco', async () => {
      const start = Date.now();

      await request(testManager.getHttpServer())
        .post(`/bank-integration/import/${consignataria.id}`)
        .expect(201);

      const duration = Date.now() - start;
      
      const metrics = await testManager.getPrisma().bankMetrics.findFirst({
        where: { bankId: consignataria.id },
        orderBy: { timestamp: 'desc' },
      });

      expect(metrics.responseTime).toBeLessThanOrEqual(duration);
    });

    it('deve registrar taxa de erro', async () => {
      bankApiMock.mockNetworkError();

      await request(testManager.getHttpServer())
        .post(`/bank-integration/import/${consignataria.id}`)
        .expect(503);

      const metrics = await testManager.getPrisma().bankMetrics.findFirst({
        where: { bankId: consignataria.id },
        orderBy: { timestamp: 'desc' },
      });

      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });
});
