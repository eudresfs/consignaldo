import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-business-days';

@Injectable()
export class FinancialUtil {
  constructor(private readonly config: ConfigService) {
    // Carrega feriados do banco de dados ou arquivo de configuração
    const holidays = this.config.get('holidays') || [];
    moment.updateLocale('pt-br', {
      holidays,
      holidayFormat: 'YYYY-MM-DD',
    });
  }

  roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  roundPercentage(value: number): number {
    return Math.round(value * 10000) / 10000;
  }

  calculateDueDate(baseDate: Date, installmentNumber: number): Date {
    const date = moment(baseDate).businessAdd(installmentNumber * 30);
    return date.toDate();
  }

  calculateWorkingDays(startDate: Date, endDate: Date): number {
    return moment(startDate).businessDiff(moment(endDate));
  }

  isWorkingDay(date: Date): boolean {
    return moment(date).isBusinessDay();
  }

  nextWorkingDay(date: Date): Date {
    return moment(date).nextBusinessDay().toDate();
  }

  previousWorkingDay(date: Date): Date {
    return moment(date).prevBusinessDay().toDate();
  }

  calculateIOF(
    valor: number,
    prazo: number,
    taxa: number,
    isRefinancing: boolean = false,
  ): number {
    // IOF para operações de crédito
    const iofDiario = this.roundCurrency(valor * 0.0082 * Math.min(prazo, 365));
    const iofAdicional = this.roundCurrency(valor * 0.0038);

    // IOF reduzido para refinanciamento
    if (isRefinancing) {
      return this.roundCurrency((iofDiario + iofAdicional) * 0.5);
    }

    return this.roundCurrency(iofDiario + iofAdicional);
  }

  calculatePMT(
    valor: number,
    prazo: number,
    taxaAnual: number,
    tipo: 'PRICE' | 'SAC' = 'PRICE',
  ): number {
    const taxaMensal = this.annualToMonthlyRate(taxaAnual);

    if (tipo === 'SAC') {
      const amortizacao = valor / prazo;
      const juros = valor * taxaMensal;
      return this.roundCurrency(amortizacao + juros);
    }

    const taxa = taxaMensal;
    const pmt =
      (valor * taxa * Math.pow(1 + taxa, prazo)) /
      (Math.pow(1 + taxa, prazo) - 1);

    return this.roundCurrency(pmt);
  }

  annualToMonthlyRate(annualRate: number): number {
    return this.roundPercentage(Math.pow(1 + annualRate, 1 / 12) - 1);
  }

  monthlyToAnnualRate(monthlyRate: number): number {
    return this.roundPercentage(Math.pow(1 + monthlyRate, 12) - 1);
  }

  calculateCET(
    valor: number,
    parcela: number,
    prazo: number,
    tarifas: any[],
    iof: number,
  ): number {
    let taxa = 0.01; // Taxa inicial
    const tolerance = 0.0000001;
    let iteration = 0;
    const maxIterations = 100;

    while (iteration < maxIterations) {
      const npv = this.calculateNPV(valor, parcela, prazo, taxa);
      const derivative = this.calculateNPVDerivative(valor, parcela, prazo, taxa);

      const delta = npv / derivative;
      taxa -= delta;

      if (Math.abs(delta) < tolerance) {
        break;
      }

      iteration++;
    }

    // Converte para taxa anual
    const taxaAnual = this.monthlyToAnnualRate(taxa);
    return this.roundPercentage(taxaAnual * 100);
  }

  private calculateNPV(
    valor: number,
    parcela: number,
    prazo: number,
    taxa: number,
  ): number {
    let npv = -valor;
    for (let i = 1; i <= prazo; i++) {
      npv += parcela / Math.pow(1 + taxa, i);
    }
    return npv;
  }

  private calculateNPVDerivative(
    valor: number,
    parcela: number,
    prazo: number,
    taxa: number,
  ): number {
    let derivative = 0;
    for (let i = 1; i <= prazo; i++) {
      derivative -= (i * parcela) / Math.pow(1 + taxa, i + 1);
    }
    return derivative;
  }
}
