import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { IntegrationService } from '../services/integration.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';

@Processor('folha-pagamento')
export class FolhaPagamentoProcessor {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  @Process('processar-folha')
  async processarFolha(job: Job) {
    const { consignanteId, competencia, arquivo } = job.data;

    try {
      this.logger.log(
        'Iniciando processamento de folha',
        'FolhaPagamentoProcessor',
        { jobId: job.id, consignanteId }
      );

      // Atualiza progresso
      await job.progress(10);

      // Importa folha via integração
      const result = await this.integrationService.importarFolhaPagamento(
        consignanteId,
        competencia,
        arquivo
      );

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      await job.progress(50);

      // Processa dados recebidos
      const folhas = result.data;
      await this.prisma.$transaction(async (tx) => {
        // Remove folhas antigas da competência
        await tx.folhaPagamento.deleteMany({
          where: {
            consignanteId,
            competencia,
          },
        });

        // Insere novas folhas
        await tx.folhaPagamento.createMany({
          data: folhas.map(f => ({
            consignanteId,
            competencia,
            matricula: f.matricula,
            nome: f.nome,
            cpf: f.cpf,
            salarioBruto: f.salarioBruto,
            descontos: f.descontos,
            salarioLiquido: f.salarioLiquido,
            margem: f.margem,
          })),
        });

        // Atualiza margens dos servidores
        for (const folha of folhas) {
          if (folha.margem) {
            await tx.servidor.update({
              where: {
                matricula_consignanteId: {
                  matricula: folha.matricula,
                  consignanteId,
                },
              },
              data: {
                margemDisponivel: folha.margem,
                ultimaAtualizacaoMargem: new Date(),
              },
            });
          }
        }
      });

      await job.progress(100);

      this.logger.log(
        'Processamento de folha concluído',
        'FolhaPagamentoProcessor',
        { 
          jobId: job.id,
          consignanteId,
          totalProcessado: folhas.length
        }
      );

      return { processados: folhas.length };
    } catch (error) {
      this.logger.error(
        'Erro no processamento de folha',
        error.stack,
        'FolhaPagamentoProcessor',
        { jobId: job.id, consignanteId }
      );

      throw error;
    }
  }
}
