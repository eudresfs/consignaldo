import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { IntegrationService } from '../services/integration.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { AverbacaoStatus } from '../domain/enums/averbacao.enum';

@Processor('averbacao')
export class AverbacaoProcessor {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  @Process('processar-averbacao')
  async processarAverbacao(job: Job) {
    const { consignanteId, matricula, contrato, parcela, prazo } = job.data;

    try {
      this.logger.log(
        'Iniciando processamento de averbação',
        'AverbacaoProcessor',
        { jobId: job.id, contrato }
      );

      await job.progress(10);

      // Busca dados do contrato
      const contratoDb = await this.prisma.contrato.findUnique({
        where: { numero: contrato },
        include: {
          servidor: true,
          consignataria: true,
        },
      });

      if (!contratoDb) {
        throw new Error(`Contrato ${contrato} não encontrado`);
      }

      await job.progress(30);

      // Realiza averbação via integração
      const result = await this.integrationService.averbarContrato(
        consignanteId,
        {
          matricula,
          contrato,
          parcela,
          prazo,
          dataInicio: new Date(),
          banco: contratoDb.consignataria.codigo,
          situacao: 'PENDENTE',
        }
      );

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      await job.progress(70);

      // Atualiza status do contrato
      await this.prisma.contrato.update({
        where: { numero: contrato },
        data: {
          status: AverbacaoStatus.AVERBADO,
          dataAverbacao: new Date(),
          observacao: 'Averbação realizada com sucesso',
        },
      });

      // Atualiza margem do servidor
      await this.prisma.servidor.update({
        where: {
          matricula_consignanteId: {
            matricula,
            consignanteId,
          },
        },
        data: {
          margemDisponivel: {
            decrement: parcela,
          },
        },
      });

      await job.progress(100);

      this.logger.log(
        'Processamento de averbação concluído',
        'AverbacaoProcessor',
        { jobId: job.id, contrato }
      );

      return { contrato, status: 'AVERBADO' };
    } catch (error) {
      this.logger.error(
        'Erro no processamento de averbação',
        error.stack,
        'AverbacaoProcessor',
        { jobId: job.id, contrato }
      );

      // Atualiza status do contrato para erro
      await this.prisma.contrato.update({
        where: { numero: contrato },
        data: {
          status: AverbacaoStatus.ERRO,
          observacao: `Erro na averbação: ${error.message}`,
        },
      });

      throw error;
    }
  }
}
