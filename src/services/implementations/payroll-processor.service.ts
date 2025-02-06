import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MargemService } from '../margem.service';
import { NotificationService } from '../notification.service';
import {
  PayrollRecord,
  PayrollDiscount,
  PayrollReconciliation,
  ReconciliationStatus,
  ReconciliationAction,
} from '../../domain/interfaces/payroll.interface';
import { MargemInsuficienteException } from '../../exceptions/margem-insuficiente.exception';

@Injectable()
export class PayrollProcessorService {
  private readonly logger = new Logger(PayrollProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly margemService: MargemService,
    private readonly notificationService: NotificationService,
  ) {}

  async processRecord(record: PayrollRecord): Promise<void> {
    const servidor = await this.findOrCreateServidor(record);
    await this.updateMargens(servidor.id, record);
    await this.processDescontos(servidor.id, record.descontos);
  }

  async reconcilePayroll(payrollId: string): Promise<PayrollReconciliation[]> {
    const reconciliations: PayrollReconciliation[] = [];
    const contratos = await this.getActiveContracts(payrollId);

    for (const contrato of contratos) {
      const reconciliation = await this.reconcileContract(payrollId, contrato);
      reconciliations.push(reconciliation);

      await this.handleReconciliationAction(reconciliation);
    }

    return reconciliations;
  }

  private async findOrCreateServidor(record: PayrollRecord) {
    const servidor = await this.prisma.servidor.findFirst({
      where: {
        OR: [
          { matricula: record.matricula },
          { cpf: record.cpf },
        ],
      },
    });

    if (servidor) {
      return this.prisma.servidor.update({
        where: { id: servidor.id },
        data: {
          nome: record.nome,
          salarioBruto: record.salarioBruto,
          salarioLiquido: record.salarioLiquido,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.servidor.create({
      data: {
        matricula: record.matricula,
        cpf: record.cpf,
        nome: record.nome,
        salarioBruto: record.salarioBruto,
        salarioLiquido: record.salarioLiquido,
      },
    });
  }

  private async updateMargens(servidorId: number, record: PayrollRecord) {
    try {
      await this.margemService.atualizarMargem({
        servidorId,
        margemDisponivel: record.margemDisponivel,
        margemUtilizada: record.margemUtilizada,
      });
    } catch (error) {
      if (error instanceof MargemInsuficienteException) {
        await this.notificationService.notifyMargemInsuficiente({
          servidorId,
          margem: record.margemDisponivel,
          margemNecessaria: error.margemNecessaria,
        });
      }
      throw error;
    }
  }

  private async processDescontos(servidorId: number, descontos: PayrollDiscount[]) {
    for (const desconto of descontos) {
      if (desconto.contratoId) {
        await this.processContratoDesconto(servidorId, desconto);
      } else {
        await this.processOutroDesconto(servidorId, desconto);
      }
    }
  }

  private async processContratoDesconto(servidorId: number, desconto: PayrollDiscount) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: desconto.contratoId },
    });

    if (!contrato) {
      this.logger.warn(`Contrato ${desconto.contratoId} não encontrado para desconto`);
      return;
    }

    await this.prisma.descontoContrato.create({
      data: {
        contratoId: desconto.contratoId,
        servidorId,
        valor: desconto.valor,
        competencia: new Date().toISOString().slice(0, 7),
      },
    });
  }

  private async processOutroDesconto(servidorId: number, desconto: PayrollDiscount) {
    await this.prisma.outroDesconto.create({
      data: {
        servidorId,
        codigo: desconto.codigo,
        descricao: desconto.descricao,
        valor: desconto.valor,
        consignatariaId: desconto.consignatariaId,
        competencia: new Date().toISOString().slice(0, 7),
      },
    });
  }

  private async getActiveContracts(payrollId: string) {
    const payroll = await this.prisma.payrollImport.findUnique({
      where: { id: payrollId },
      include: { consignante: true },
    });

    return this.prisma.contrato.findMany({
      where: {
        servidor: {
          consignanteId: payroll.consignanteId,
        },
        status: 'AVERBADO',
      },
      include: {
        servidor: true,
        consignataria: true,
      },
    });
  }

  private async reconcileContract(
    payrollId: string,
    contrato: any,
  ): Promise<PayrollReconciliation> {
    const descontos = await this.prisma.descontoContrato.findMany({
      where: {
        contratoId: contrato.id,
        payrollImportId: payrollId,
      },
    });

    const actualValue = descontos.reduce((sum, d) => sum + d.valor, 0);
    const difference = Math.abs(contrato.parcela - actualValue);
    
    let status: ReconciliationStatus;
    let action: ReconciliationAction;

    if (actualValue === 0) {
      status = ReconciliationStatus.MISSING;
      action = ReconciliationAction.NOTIFY;
    } else if (difference > 0.01) { // Tolerância de 1 centavo
      status = ReconciliationStatus.DIVERGENT;
      action = this.determineAction(difference, contrato.parcela);
    } else {
      status = ReconciliationStatus.MATCHED;
      action = ReconciliationAction.NONE;
    }

    return this.prisma.payrollReconciliation.create({
      data: {
        payrollId,
        contractId: contrato.id,
        status,
        expectedValue: contrato.parcela,
        actualValue,
        difference,
        action,
      },
    });
  }

  private determineAction(difference: number, parcela: number): ReconciliationAction {
    const percentDifference = (difference / parcela) * 100;

    if (percentDifference > 10) { // Diferença maior que 10%
      return ReconciliationAction.SUSPEND;
    } else if (percentDifference > 5) { // Diferença maior que 5%
      return ReconciliationAction.UPDATE;
    } else {
      return ReconciliationAction.NOTIFY;
    }
  }

  private async handleReconciliationAction(reconciliation: PayrollReconciliation) {
    switch (reconciliation.action) {
      case ReconciliationAction.SUSPEND:
        await this.suspendContract(reconciliation);
        break;
      case ReconciliationAction.UPDATE:
        await this.updateContractValue(reconciliation);
        break;
      case ReconciliationAction.NOTIFY:
        await this.notifyReconciliation(reconciliation);
        break;
    }
  }

  private async suspendContract(reconciliation: PayrollReconciliation) {
    await this.prisma.contrato.update({
      where: { id: reconciliation.contractId },
      data: { status: 'SUSPENSO' },
    });

    await this.notificationService.notifyContractSuspension({
      reconciliationId: reconciliation.id,
      reason: 'Divergência significativa no valor da parcela',
    });
  }

  private async updateContractValue(reconciliation: PayrollReconciliation) {
    await this.prisma.contrato.update({
      where: { id: reconciliation.contractId },
      data: { parcela: reconciliation.actualValue },
    });

    await this.notificationService.notifyContractUpdate({
      reconciliationId: reconciliation.id,
      oldValue: reconciliation.expectedValue,
      newValue: reconciliation.actualValue,
    });
  }

  private async notifyReconciliation(reconciliation: PayrollReconciliation) {
    await this.notificationService.notifyReconciliationIssue({
      reconciliationId: reconciliation.id,
      status: reconciliation.status,
      difference: reconciliation.difference,
    });
  }
}
