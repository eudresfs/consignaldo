import { Test, TestingModule } from '@nestjs/testing';
import { ConciliacaoService } from '../../../services/conciliacao.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { StatusConciliacao } from '../../../domain/conciliacao/conciliacao.types';
import { mockDeep, MockProxy } from 'jest-mock-extended';

describe('ConciliacaoService', () => {
  let service: ConciliacaoService;
  let prismaService: MockProxy<PrismaService>;
  let queue: MockProxy<Queue>;

  beforeEach(async () => {
    prismaService = mockDeep<PrismaService>();
    queue = mockDeep<Queue>();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: 'conciliacao',
        }),
      ],
      providers: [
        ConciliacaoService,
        ConfigService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: getQueueToken('conciliacao'),
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get<ConciliacaoService>(ConciliacaoService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('iniciarConciliacaoDiaria', () => {
    it('deve enfileirar transações pendentes para processamento', async () => {
      const mockTransacoes = [
        { id: '1', status: StatusConciliacao.PENDENTE },
        { id: '2', status: StatusConciliacao.PENDENTE },
      ];

      prismaService.transacaoBancaria.findMany.mockResolvedValue(mockTransacoes);

      await service.iniciarConciliacaoDiaria();

      expect(queue.add).toHaveBeenCalledTimes(2);
      expect(queue.add).toHaveBeenCalledWith(
        'processar-transacao',
        { transacaoId: '1' },
        expect.any(Object),
      );
      expect(queue.add).toHaveBeenCalledWith(
        'processar-transacao',
        { transacaoId: '2' },
        expect.any(Object),
      );
    });
  });

  describe('processarTransacao', () => {
    it('deve processar transação com sucesso quando não há divergências', async () => {
      const mockTransacao = {
        id: '1',
        numeroContrato: 'CONT-001',
        valor: 1000,
        dataPagamento: new Date(),
        status: StatusConciliacao.PENDENTE,
      };

      const mockContrato = {
        numeroContrato: 'CONT-001',
        valorParcela: 1000,
      };

      prismaService.transacaoBancaria.findUnique.mockResolvedValue(mockTransacao);
      prismaService.contrato.findUnique.mockResolvedValue(mockContrato);

      const resultado = await service.processarTransacao('1');

      expect(resultado.status).toBe(StatusConciliacao.CONCILIADO);
      expect(resultado.divergencias).toHaveLength(0);
      expect(prismaService.transacaoBancaria.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: StatusConciliacao.CONCILIADO,
        }),
      });
    });

    it('deve identificar divergências quando valores não correspondem', async () => {
      const mockTransacao = {
        id: '1',
        numeroContrato: 'CONT-001',
        valor: 1000,
        dataPagamento: new Date(),
        status: StatusConciliacao.PENDENTE,
      };

      const mockContrato = {
        numeroContrato: 'CONT-001',
        valorParcela: 1100, // Valor diferente
      };

      prismaService.transacaoBancaria.findUnique.mockResolvedValue(mockTransacao);
      prismaService.contrato.findUnique.mockResolvedValue(mockContrato);

      const resultado = await service.processarTransacao('1');

      expect(resultado.status).toBe(StatusConciliacao.DIVERGENTE);
      expect(resultado.divergencias).toHaveLength(1);
      expect(resultado.divergencias[0].campo).toBe('valor');
    });
  });
});
