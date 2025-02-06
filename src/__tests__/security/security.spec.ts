import { IntegrationTestManager } from '../integration/setup';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { hash } from 'bcrypt';

describe('Testes de Segurança', () => {
  let testManager: IntegrationTestManager;

  beforeAll(async () => {
    testManager = new IntegrationTestManager();
    await testManager.init();
  });

  afterAll(async () => {
    await testManager.cleanup();
  });

  describe('Autenticação', () => {
    it('deve bloquear acesso sem token', async () => {
      await request(testManager.getHttpServer())
        .get('/loan-simulation/1')
        .expect(401);
    });

    it('deve bloquear token expirado', async () => {
      const token = jwt.sign(
        { userId: 1, exp: Math.floor(Date.now() / 1000) - 3600 },
        'secret'
      );

      await request(testManager.getHttpServer())
        .get('/loan-simulation/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('deve bloquear token inválido', async () => {
      await request(testManager.getHttpServer())
        .get('/loan-simulation/1')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Autorização', () => {
    it('deve bloquear acesso a recursos não autorizados', async () => {
      const token = jwt.sign(
        { userId: 1, role: 'USER' },
        'secret'
      );

      await request(testManager.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Validação de Entrada', () => {
    it('deve bloquear SQL Injection', async () => {
      await request(testManager.getHttpServer())
        .get('/servidor/1; DROP TABLE usuarios;')
        .expect(400);
    });

    it('deve bloquear XSS', async () => {
      await request(testManager.getHttpServer())
        .post('/servidor')
        .send({
          nome: '<script>alert("xss")</script>',
          cpf: '12345678900',
        })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('deve bloquear múltiplas requisições', async () => {
      const requests = Array(100).fill(0).map(() =>
        request(testManager.getHttpServer())
          .get('/health')
          .set('X-Forwarded-For', '1.2.3.4')
      );

      const responses = await Promise.all(requests);
      const blocked = responses.filter(r => r.status === 429);
      expect(blocked.length).toBeGreaterThan(0);
    });
  });

  describe('Dados Sensíveis', () => {
    it('não deve expor senhas', async () => {
      const senha = await hash('123456', 10);
      const usuario = await testManager.getPrisma().user.create({
        data: {
          email: 'test@example.com',
          senha,
          role: 'USER',
        },
      });

      const response = await request(testManager.getHttpServer())
        .get(`/user/${usuario.id}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('senha');
    });

    it('deve mascarar CPF em logs', async () => {
      const spy = jest.spyOn(console, 'log');
      
      await request(testManager.getHttpServer())
        .post('/servidor')
        .send({
          nome: 'Test',
          cpf: '12345678900',
        });

      const logs = spy.mock.calls.flat();
      const cpfExposed = logs.some(log => 
        typeof log === 'string' && log.includes('12345678900')
      );

      expect(cpfExposed).toBe(false);
      spy.mockRestore();
    });
  });
});
