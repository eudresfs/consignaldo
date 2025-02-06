import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TipoRelatorio, FormatoRelatorio } from '../../../domain/relatorios/relatorios.types';
import { createTestUser, createTestToken } from '../../test-utils/auth';

describe('Relatorios (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let gestorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Criar usuários de teste
    const adminUser = await createTestUser(prisma, { role: 'ADMIN' });
    const gestorUser = await createTestUser(prisma, { role: 'GESTOR' });
    
    // Gerar tokens
    adminToken = await createTestToken(app, adminUser);
    gestorToken = await createTestToken(app, gestorUser);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('/relatorios/templates', () => {
    let templateId: string;

    const mockTemplate = {
      nome: 'Template de Teste',
      tipo: TipoRelatorio.CONTRATOS,
      formato: FormatoRelatorio.PDF,
      layout: 'Layout de teste {{data}}',
      cabecalho: 'Cabeçalho',
      rodape: 'Rodapé'
    };

    it('POST /templates - deve criar template (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .post('/relatorios/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockTemplate);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe(mockTemplate.nome);

      templateId = response.body.id;
    });

    it('POST /templates - deve rejeitar criação (GESTOR)', async () => {
      const response = await request(app.getHttpServer())
        .post('/relatorios/templates')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send(mockTemplate);

      expect(response.status).toBe(403);
    });

    it('GET /templates - deve listar templates (GESTOR)', async () => {
      const response = await request(app.getHttpServer())
        .get('/relatorios/templates')
        .set('Authorization', `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('PUT /templates/:id - deve atualizar template (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/relatorios/templates/${templateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...mockTemplate,
          nome: 'Template Atualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Template Atualizado');
    });
  });

  describe('/relatorios', () => {
    let relatorioId: string;

    it('POST /gerar - deve iniciar geração de relatório (GESTOR)', async () => {
      // Primeiro, buscar um template existente
      const templatesResponse = await request(app.getHttpServer())
        .get('/relatorios/templates')
        .set('Authorization', `Bearer ${gestorToken}`);

      const templateId = templatesResponse.body[0].id;

      const response = await request(app.getHttpServer())
        .post('/relatorios/gerar')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({
          templateId,
          formato: FormatoRelatorio.PDF,
          filtros: {
            dataInicio: '2025-01-01',
            dataFim: '2025-12-31'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');

      relatorioId = response.body.id;
    });

    it('GET /:id - deve buscar relatório por ID (GESTOR)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/relatorios/${relatorioId}`)
        .set('Authorization', `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(relatorioId);
    });

    it('GET / - deve listar relatórios com paginação (GESTOR)', async () => {
      const response = await request(app.getHttpServer())
        .get('/relatorios')
        .query({
          pagina: 1,
          itensPorPagina: 10
        })
        .set('Authorization', `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('DELETE /:id - deve remover relatório (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/relatorios/${relatorioId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Verificar se foi realmente removido
      const checkResponse = await request(app.getHttpServer())
        .get(`/relatorios/${relatorioId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkResponse.status).toBe(404);
    });

    it('DELETE /:id - deve rejeitar remoção (GESTOR)', async () => {
      // Criar novo relatório para teste
      const templatesResponse = await request(app.getHttpServer())
        .get('/relatorios/templates')
        .set('Authorization', `Bearer ${gestorToken}`);

      const templateId = templatesResponse.body[0].id;

      const createResponse = await request(app.getHttpServer())
        .post('/relatorios/gerar')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({
          templateId,
          formato: FormatoRelatorio.PDF
        });

      const newRelatorioId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/relatorios/${newRelatorioId}`)
        .set('Authorization', `Bearer ${gestorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
