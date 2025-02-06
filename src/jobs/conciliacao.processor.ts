import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConciliacaoService } from '../services/conciliacao.service';

@Processor('conciliacao')
export class ConciliacaoProcessor {
  private readonly logger = new Logger(ConciliacaoProcessor.name);

  constructor(private readonly conciliacaoService: ConciliacaoService) {}

  @Process('processar-transacao')
  async processarTransacao(job: Job<{ transacaoId: string }>) {
    this.logger.log(`Processando transação ${job.data.transacaoId}`);

    try {
      const resultado = await this.conciliacaoService.processarTransacao(job.data.transacaoId);
      this.logger.log(`Transação ${job.data.transacaoId} processada com sucesso. Status: ${resultado.status}`);
      return resultado;
    } catch (error) {
      this.logger.error(`Erro ao processar transação ${job.data.transacaoId}`, error);
      throw error;
    }
  }
}
