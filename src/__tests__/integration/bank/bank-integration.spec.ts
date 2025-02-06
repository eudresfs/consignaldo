import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { BankIntegrationService } from '../../../services/bank-integration.service';
import { WebhookEvent } from '../../../domain/interfaces/bank-integration.interface';
import * as crypto from 'crypto';

describe('Integração Bancária (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bankService: BankIntegrationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    bankService = app.get<BankIntegrationService>(BankIntegrationService);
    await app.init();
  });

  beforeEach(async () => {
    // Limpa dados de teste
    await prisma.contract.deleteMany();
    await prisma.proposal.deleteMany();
    await prisma.bankIntegration.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Fluxo de Integração', () => {
    it('deve completar ciclo de proposta com sucesso', async () => {
      // 1. Configurar integração bancária
      const bank = await prisma.bankIntegration.create({
        data: {
          name: 'Banco Teste',
          code: 'TST',
          active: true,
          apiUrl: 'https://api.test-bank.com',
          apiKey: crypto.randomBytes(32).toString('hex'),
          webhookSecret: crypto.randomBytes(32).toString('hex'),
        },
      });

      // 2. Criar servidor
      const servidor = await prisma.servidor.create({
        data: {
          nome: 'João Silva',
          cpf: '12345678900',
          matricula: '123456',
          salario: 5000,
        },
      });

      // 3. Criar proposta
      const proposal = await prisma.proposal.create({
        data: {
          valor: 10000,
          prazo: 24,
          parcela: 500,
          status: 'PENDING',
          servidorId: servidor.id,
          bankId: bank.id,
        },
      });

      // 4. Simular webhook de aprovação
      const webhookPayload = {
        event: WebhookEvent.PROPOSAL_UPDATED,
        data: {
          id: proposal.id,
          status: 'APPROVED',
          bankProposalId: 'BANK-123',
        },
        timestamp: new Date().toISOString(),
      };

      const signature = crypto
        .createHmac('sha256', bank.webhookSecret)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      await request(app.getHttpServer())
        .post(`/webhook/bank/${bank.id}`)
        .set('X-Webhook-Signature', signature)
        .send(webhookPayload)
        .expect(200);

      // 5. Verificar atualização da proposta
      const updatedProposal = await prisma.proposal.findUnique({
        where: { id: proposal.id },
      });

      expect(updatedProposal).toMatchObject({
        status: 'APPROVED',
        bankProposalId: 'BANK-123',
      });

      // 6. Criar contrato
      const contract = await prisma.contract.create({
        data: {
          proposalId: proposal.id,
          status: 'PENDING',
          valor: proposal.valor,
          prazo: proposal.prazo,
          parcela: proposal.parcela,
        },
      });

      // 7. Exportar contrato
      await bankService.exportContract(contract.id, bank.id);

      // 8. Verificar status do contrato
      const updatedContract = await prisma.contract.findUnique({
        where: { id: contract.id },
      });

      expect(updatedContract).toMatchObject({
        status: 'EXPORTED',
        exportedAt: expect.any(Date),
      });
    });

    it('deve rejeitar webhook com assinatura inválida', async () => {
      const bank = await prisma.bankIntegration.create({
        data: {
          name: 'Banco Teste',
          code: 'TST',
          active: true,
          apiUrl: 'https://api.test-bank.com',
          apiKey: crypto.randomBytes(32).toString('hex'),
          webhookSecret: crypto.randomBytes(32).toString('hex'),
        },
      });

      const webhookPayload = {
        event: WebhookEvent.PROPOSAL_UPDATED,
        data: {
          id: '123',
          status: 'APPROVED',
        },
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post(`/webhook/bank/${bank.id}`)
        .set('X-Webhook-Signature', 'invalid-signature')
        .send(webhookPayload)
        .expect(401);
    });

    it('deve lidar com timeout na integração', async () => {
      const bank = await prisma.bankIntegration.create({
        data: {
          name: 'Banco Lento',
          code: 'SLOW',
          active: true,
          apiUrl: 'https://slow-api.test-bank.com',
          apiKey: crypto.randomBytes(32).toString('hex'),
          webhookSecret: crypto.randomBytes(32).toString('hex'),
          timeout: 1000, // 1 segundo
        },
      });

      // Mock para simular timeout
      jest.spyOn(bankService as any, 'fetchProposalsFromBank')
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));

      await expect(
        bankService.importProposals(bank.id)
      ).rejects.toThrow('Request timeout');
    });

    it('deve respeitar rate limiting', async () => {
      const bank = await prisma.bankIntegration.create({
        data: {
          name: 'Banco Rate Limited',
          code: 'RATE',
          active: true,
          apiUrl: 'https://api.test-bank.com',
          apiKey: crypto.randomBytes(32).toString('hex'),
          webhookSecret: crypto.randomBytes(32).toString('hex'),
          rateLimit: 2, // 2 requisições por minuto
        },
      });

      // Primeira requisição
      await request(app.getHttpServer())
        .get(`/bank/${bank.id}/proposals`)
        .expect(200);

      // Segunda requisição
      await request(app.getHttpServer())
        .get(`/bank/${bank.id}/proposals`)
        .expect(200);

      // Terceira requisição (deve ser bloqueada)
      await request(app.getHttpServer())
        .get(`/bank/${bank.id}/proposals`)
        .expect(429);
    });
  });
});
