import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Performance Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Notificações', () => {
    const notificacoes = Array.from({ length: 100 }, (_, i) => ({
      id: `${i + 1}`,
      tipo: 'EMAIL',
      destinatario: `teste${i + 1}@teste.com`,
      titulo: `Teste ${i + 1}`,
      conteudo: `Conteúdo teste ${i + 1}`,
      prioridade: 'MEDIA',
    }));

    it('should handle multiple notifications concurrently', async () => {
      const start = Date.now();

      await Promise.all(
        notificacoes.map((notificacao) =>
          request(app.getHttpServer())
            .post('/notificacoes')
            .send(notificacao)
            .expect(201),
        ),
      );

      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeLessThan(5000); // 5 segundos
    });

    it('should list notifications with pagination efficiently', async () => {
      const start = Date.now();

      const response = await request(app.getHttpServer())
        .get('/notificacoes')
        .query({
          limite: 50,
          pagina: 0,
        })
        .expect(200);

      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeLessThan(1000); // 1 segundo
      expect(response.body.items).toHaveLength(50);
    });
  });

  describe('Cache', () => {
    it('should cache template results', async () => {
      const template = {
        nome: 'Template Teste',
        tipo: 'EMAIL',
        assunto: 'Teste',
        conteudo: 'Conteúdo teste',
      };

      // Primeira requisição (sem cache)
      const start1 = Date.now();
      await request(app.getHttpServer())
        .post('/notificacoes/templates')
        .send(template)
        .expect(201);
      const duration1 = Date.now() - start1;

      // Segunda requisição (com cache)
      const start2 = Date.now();
      await request(app.getHttpServer())
        .post('/notificacoes/templates')
        .send(template)
        .expect(201);
      const duration2 = Date.now() - start2;

      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('Métricas', () => {
    it('should calculate statistics efficiently', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/notificacoes/estatisticas')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // 2 segundos
    });
  });

  describe('Ordenação e Filtros', () => {
    const ordenarPorData = (a: any, b: any) => {
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    };

    it('should sort notifications efficiently', async () => {
      const response = await request(app.getHttpServer())
        .get('/notificacoes')
        .query({
          ordenarPor: 'criadoEm',
          ordem: 'DESC',
        })
        .expect(200);

      const items = response.body.items;
      const sorted = [...items].sort(ordenarPorData);

      expect(items).toEqual(sorted);
    });
  });
});
