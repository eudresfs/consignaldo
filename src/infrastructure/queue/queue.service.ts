import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('folha-pagamento')
    private readonly folhaPagamentoQueue: Queue,
    @InjectQueue('averbacao')
    private readonly averbacaoQueue: Queue,
    private readonly logger: LoggerService,
  ) {}

  async adicionarJobFolha(data: {
    consignanteId: number;
    competencia: string;
    arquivo: Buffer;
  }) {
    try {
      const job = await this.folhaPagamentoQueue.add('processar-folha', data, {
        jobId: `folha-${data.consignanteId}-${data.competencia}`,
      });

      this.logger.log(
        'Job de processamento de folha adicionado',
        'QueueService',
        { jobId: job.id }
      );

      return job;
    } catch (error) {
      this.logger.error(
        'Erro ao adicionar job de folha',
        error.stack,
        'QueueService',
        { consignanteId: data.consignanteId }
      );
      throw error;
    }
  }

  async adicionarJobAverbacao(data: {
    consignanteId: number;
    matricula: string;
    contrato: string;
    parcela: number;
    prazo: number;
  }) {
    try {
      const job = await this.averbacaoQueue.add('processar-averbacao', data, {
        jobId: `averbacao-${data.consignanteId}-${data.contrato}`,
        priority: 1, // Alta prioridade
      });

      this.logger.log(
        'Job de averbação adicionado',
        'QueueService',
        { jobId: job.id }
      );

      return job;
    } catch (error) {
      this.logger.error(
        'Erro ao adicionar job de averbação',
        error.stack,
        'QueueService',
        { consignanteId: data.consignanteId }
      );
      throw error;
    }
  }

  async getJobStatus(queueName: string, jobId: string) {
    const queue = this.getQueueByName(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    const failCount = job.attemptsMade;

    return {
      id: job.id,
      state,
      progress,
      failCount,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
    };
  }

  async limparFilas() {
    await Promise.all([
      this.folhaPagamentoQueue.clean(0, 'completed'),
      this.averbacaoQueue.clean(0, 'completed'),
    ]);
  }

  private getQueueByName(name: string): Queue {
    switch (name) {
      case 'folha-pagamento':
        return this.folhaPagamentoQueue;
      case 'averbacao':
        return this.averbacaoQueue;
      default:
        throw new Error(`Fila ${name} não encontrada`);
    }
  }
}
