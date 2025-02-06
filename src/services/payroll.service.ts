import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import { QueueService } from '../infrastructure/queue/queue.service';
import { NotificationService } from './notification.service';
import {
  PayrollImport,
  PayrollRecord,
  PayrollTemplate,
  PayrollStatus,
  PayrollReconciliation,
  ReconciliationStatus,
  ReconciliationAction,
} from '../domain/interfaces/payroll.interface';
import * as csv from 'csv-parse';
import * as iconv from 'iconv-lite';
import { Readable } from 'stream';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
    private readonly notification: NotificationService,
  ) {}

  async importPayroll(
    consignanteId: number,
    file: Express.Multer.File,
    competencia: string,
  ): Promise<PayrollImport> {
    const template = await this.getPayrollTemplate(consignanteId);
    
    const import_ = await this.prisma.payrollImport.create({
      data: {
        consignanteId,
        competencia,
        fileName: file.originalname,
        status: PayrollStatus.PENDING,
        totalRecords: 0,
        processedRecords: 0,
      },
    });

    // Upload do arquivo
    const filePath = `payroll/${consignanteId}/${import_.id}/${file.originalname}`;
    await this.storage.upload(filePath, file.buffer);

    // Inicia processamento assíncrono
    await this.queue.add('process-payroll', {
      importId: import_.id,
      filePath,
      template,
    });

    return import_;
  }

  async processPayroll(importId: string): Promise<void> {
    const import_ = await this.prisma.payrollImport.findUnique({
      where: { id: importId },
      include: { template: true },
    });

    if (!import_) {
      throw new Error(`Import ${importId} not found`);
    }

    try {
      await this.updateImportStatus(importId, PayrollStatus.PROCESSING);

      const fileBuffer = await this.storage.download(import_.filePath);
      const records = await this.parsePayrollFile(fileBuffer, import_.template);

      let processedRecords = 0;
      const errors = [];

      for (const record of records) {
        try {
          await this.processPayrollRecord(record, import_);
          processedRecords++;
        } catch (error) {
          errors.push({
            line: processedRecords + 1,
            error: error.message,
          });
        }

        if (processedRecords % 100 === 0) {
          await this.updateProcessedRecords(importId, processedRecords);
        }
      }

      const status = errors.length > 0 ? PayrollStatus.ERROR : PayrollStatus.COMPLETED;
      await this.finalizeImport(importId, status, processedRecords, errors);

      // Inicia reconciliação
      await this.queue.add('reconcile-payroll', { importId });

    } catch (error) {
      this.logger.error(`Error processing payroll ${importId}:`, error);
      await this.updateImportStatus(importId, PayrollStatus.ERROR);
      throw error;
    }
  }

  async reconcilePayroll(importId: string): Promise<PayrollReconciliation[]> {
    const import_ = await this.prisma.payrollImport.findUnique({
      where: { id: importId },
      include: {
        records: {
          include: {
            descontos: true,
          },
        },
      },
    });

    if (!import_) {
      throw new Error(`Import ${importId} not found`);
    }

    const reconciliations: PayrollReconciliation[] = [];

    // Busca contratos ativos
    const contracts = await this.prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        consignanteId: import_.consignanteId,
      },
    });

    for (const contract of contracts) {
      const record = import_.records.find(r => 
        r.descontos.some(d => d.contratoId === contract.id)
      );

      const reconciliation = await this.reconcileContract(contract, record);
      reconciliations.push(reconciliation);

      if (reconciliation.status !== ReconciliationStatus.MATCHED) {
        await this.handleReconciliationAction(reconciliation);
      }
    }

    return reconciliations;
  }

  private async getPayrollTemplate(consignanteId: number): Promise<PayrollTemplate> {
    const template = await this.prisma.payrollTemplate.findFirst({
      where: {
        consignanteId,
        active: true,
      },
    });

    if (!template) {
      throw new Error(`No active template found for consignante ${consignanteId}`);
    }

    return template;
  }

  private async parsePayrollFile(
    buffer: Buffer,
    template: PayrollTemplate,
  ): Promise<PayrollRecord[]> {
    const content = iconv.decode(buffer, template.encoding);
    const records: PayrollRecord[] = [];

    return new Promise((resolve, reject) => {
      const parser = csv.parse({
        delimiter: template.delimiter,
        from_line: template.skipLines + 1,
        columns: template.columns.map(c => c.name),
      });

      const stream = Readable.from(content);
      stream.pipe(parser);

      parser.on('readable', () => {
        let record;
        while ((record = parser.read())) {
          records.push(this.validateAndTransformRecord(record, template));
        }
      });

      parser.on('error', reject);
      parser.on('end', () => resolve(records));
    });
  }

  private validateAndTransformRecord(
    record: any,
    template: PayrollTemplate,
  ): PayrollRecord {
    const transformed: any = {};

    for (const column of template.columns) {
      const value = record[column.name];

      if (column.required && !value) {
        throw new Error(`Required column ${column.name} is empty`);
      }

      if (column.type === 'number') {
        transformed[column.name] = this.parseNumber(value);
      } else if (column.type === 'date') {
        transformed[column.name] = this.parseDate(value, column.format);
      } else {
        transformed[column.name] = value;
      }

      if (column.validation) {
        this.validateField(column.name, transformed[column.name], column.validation);
      }
    }

    return transformed as PayrollRecord;
  }

  private parseNumber(value: string): number {
    return Number(value.replace(/[^\d,-]/g, '').replace(',', '.'));
  }

  private parseDate(value: string, format: string): Date {
    // Implementar parse de data baseado no formato
    return new Date(value);
  }

  private validateField(field: string, value: any, validation: string): void {
    // Implementar validações customizadas
    const validations = {
      cpf: (v: string) => /^\d{11}$/.test(v),
      matricula: (v: string) => v.length >= 5,
      // Adicionar outras validações
    };

    if (validations[validation] && !validations[validation](value)) {
      throw new Error(`Invalid ${field}: ${value}`);
    }
  }

  private async processPayrollRecord(
    record: PayrollRecord,
    import_: PayrollImport,
  ): Promise<void> {
    // Atualiza ou cria servidor
    const servidor = await this.prisma.servidor.upsert({
      where: { cpf: record.cpf },
      update: {
        nome: record.nome,
        salarioBruto: record.salarioBruto,
        salarioLiquido: record.salarioLiquido,
      },
      create: {
        cpf: record.cpf,
        nome: record.nome,
        matricula: record.matricula,
        salarioBruto: record.salarioBruto,
        salarioLiquido: record.salarioLiquido,
      },
    });

    // Atualiza margem
    await this.prisma.margem.create({
      data: {
        servidorId: servidor.id,
        competencia: import_.competencia,
        disponivel: record.margemDisponivel,
        utilizada: record.margemUtilizada,
        importId: import_.id,
      },
    });

    // Processa descontos
    for (const desconto of record.descontos) {
      await this.prisma.desconto.create({
        data: {
          servidorId: servidor.id,
          competencia: import_.competencia,
          codigo: desconto.codigo,
          descricao: desconto.descricao,
          valor: desconto.valor,
          consignatariaId: desconto.consignatariaId,
          contratoId: desconto.contratoId,
          importId: import_.id,
        },
      });
    }
  }

  private async reconcileContract(
    contract: any,
    record: PayrollRecord,
  ): Promise<PayrollReconciliation> {
    const desconto = record?.descontos.find(d => d.contratoId === contract.id);
    
    let status: ReconciliationStatus;
    let action: ReconciliationAction;

    if (!desconto) {
      status = ReconciliationStatus.MISSING;
      action = ReconciliationAction.NOTIFY;
    } else if (Math.abs(desconto.valor - contract.valorParcela) > 0.01) {
      status = ReconciliationStatus.DIVERGENT;
      action = ReconciliationAction.UPDATE;
    } else {
      status = ReconciliationStatus.MATCHED;
      action = ReconciliationAction.NONE;
    }

    return {
      id: crypto.randomUUID(),
      payrollId: record?.id,
      contractId: contract.id,
      status,
      expectedValue: contract.valorParcela,
      actualValue: desconto?.valor || 0,
      difference: (desconto?.valor || 0) - contract.valorParcela,
      action,
    };
  }

  private async handleReconciliationAction(
    reconciliation: PayrollReconciliation,
  ): Promise<void> {
    switch (reconciliation.action) {
      case ReconciliationAction.UPDATE:
        await this.updateContractValue(reconciliation);
        break;
      case ReconciliationAction.SUSPEND:
        await this.suspendContract(reconciliation.contractId);
        break;
      case ReconciliationAction.NOTIFY:
        await this.notifyReconciliationIssue(reconciliation);
        break;
    }
  }

  private async updateContractValue(reconciliation: PayrollReconciliation): Promise<void> {
    await this.prisma.contract.update({
      where: { id: reconciliation.contractId },
      data: {
        valorParcela: reconciliation.actualValue,
        observacoes: `Valor atualizado após reconciliação da folha. Diferença: ${reconciliation.difference}`,
      },
    });
  }

  private async suspendContract(contractId: string): Promise<void> {
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'SUSPENDED',
        observacoes: 'Contrato suspenso após não localização na folha de pagamento',
      },
    });
  }

  private async notifyReconciliationIssue(reconciliation: PayrollReconciliation): Promise<void> {
    await this.notification.send({
      type: 'RECONCILIATION_ISSUE',
      recipients: ['gestor'],
      data: {
        contractId: reconciliation.contractId,
        status: reconciliation.status,
        difference: reconciliation.difference,
      },
    });
  }

  private async updateImportStatus(
    importId: string,
    status: PayrollStatus,
  ): Promise<void> {
    await this.prisma.payrollImport.update({
      where: { id: importId },
      data: { status },
    });
  }

  private async updateProcessedRecords(
    importId: string,
    processedRecords: number,
  ): Promise<void> {
    await this.prisma.payrollImport.update({
      where: { id: importId },
      data: { processedRecords },
    });
  }

  private async finalizeImport(
    importId: string,
    status: PayrollStatus,
    processedRecords: number,
    errors: any[],
  ): Promise<void> {
    await this.prisma.payrollImport.update({
      where: { id: importId },
      data: {
        status,
        processedRecords,
        errors,
        finishedAt: new Date(),
      },
    });
  }
}
