import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RelatorioService } from '../services/relatorio.service';

@Processor('relatorios')
export class RelatorioProcessor {
  private readonly logger = new Logger(RelatorioProcessor.name);

  constructor(private readonly relatorioService: RelatorioService) {}

  @Process('gerar-relatorio')
  async gerarRelatorio(job: Job<{ relatorioId: string }>) {
    this.logger.log(`Processando relatório ${job.data.relatorioId}`);

    try {
      await this.relatorioService.processarRelatorio(job.data.relatorioId);
      this.logger.log(`Relatório ${job.data.relatorioId} processado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar relatório ${job.data.relatorioId}`, error);
      throw error;
    }
  }
}
