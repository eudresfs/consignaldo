import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CacheService } from '../infrastructure/cache/cache.service';
import {
  LoanSimulation,
  LoanProduct,
  LoanInstallment,
  RefinanceSimulation,
  PortabilitySimulation,
} from '../domain/interfaces/loan-simulation.interface';

@Injectable()
export class LoanSimulationService {
  private readonly logger = new Logger(LoanSimulationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  async simulate(
    servidorId: number,
    consignatariaId: number,
    valorSolicitado: number,
    prazo: number,
  ): Promise<LoanSimulation> {
    // Valida margem disponível
    const margem = await this.getMargemDisponivel(servidorId);
    if (!margem) {
      throw new Error('Margem não encontrada para o servidor');
    }

    // Busca produto
    const produto = await this.findEligibleProduct(
      consignatariaId,
      valorSolicitado,
      prazo,
    );

    // Calcula simulação
    const simulation = await this.calculateSimulation(
      valorSolicitado,
      prazo,
      produto,
      margem,
    );

    // Salva simulação
    return this.prisma.loanSimulation.create({
      data: {
        ...simulation,
        servidorId,
        consignatariaId,
      },
    });
  }

  async simulateRefinancing(
    contratoId: string,
    prazo: number,
  ): Promise<RefinanceSimulation> {
    const contrato = await this.prisma.contract.findUnique({
      where: { id: contratoId },
      include: {
        servidor: true,
        consignataria: true,
      },
    });

    if (!contrato) {
      throw new Error('Contrato não encontrado');
    }

    // Calcula saldo devedor
    const saldoDevedor = await this.calculateSaldoDevedor(contrato);

    // Busca produto para refinanciamento
    const produto = await this.findEligibleProduct(
      contrato.consignatariaId,
      saldoDevedor,
      prazo,
    );

    // Calcula simulação
    const simulation = await this.calculateSimulation(
      saldoDevedor,
      prazo,
      produto,
      contrato.valorParcela,
    );

    // Calcula economia
    const economiaTotal = this.calculateRefinancingEconomy(
      contrato,
      simulation,
    );

    return {
      ...simulation,
      contratoId,
      saldoDevedor,
      valorLiquidacao: saldoDevedor,
      valorDisponivel: simulation.valorTotal - saldoDevedor,
      economiaTotal,
    };
  }

  async simulatePortability(
    contratoOrigemId: string,
    consignatariaDestinoId: number,
    prazo: number,
  ): Promise<PortabilitySimulation> {
    const contratoOrigem = await this.prisma.contract.findUnique({
      where: { id: contratoOrigemId },
      include: {
        servidor: true,
        consignataria: true,
      },
    });

    if (!contratoOrigem) {
      throw new Error('Contrato de origem não encontrado');
    }

    // Calcula saldo devedor
    const saldoDevedor = await this.calculateSaldoDevedor(contratoOrigem);

    // Busca produto para portabilidade
    const produto = await this.findEligibleProduct(
      consignatariaDestinoId,
      saldoDevedor,
      prazo,
    );

    // Calcula simulação
    const simulation = await this.calculateSimulation(
      saldoDevedor,
      prazo,
      produto,
      contratoOrigem.valorParcela,
    );

    // Calcula valor presente das parcelas
    const valorPresenteParcelas = this.calculatePresentValue(
      contratoOrigem.valorParcela,
      contratoOrigem.parcelasRestantes,
      contratoOrigem.taxaJuros,
    );

    // Calcula economia
    const economiaTotal = this.calculatePortabilityEconomy(
      contratoOrigem,
      simulation,
    );

    return {
      ...simulation,
      contratoOrigemId,
      bancoOrigemId: contratoOrigem.consignatariaId,
      saldoDevedor,
      valorPresenteParcelas,
      economiaTotal,
    };
  }

  private async getMargemDisponivel(servidorId: number): Promise<number> {
    const margem = await this.prisma.margem.findFirst({
      where: { servidorId },
      orderBy: { competencia: 'desc' },
    });

    return margem?.disponivel || 0;
  }

  private async findEligibleProduct(
    consignatariaId: number,
    valor: number,
    prazo: number,
  ): Promise<LoanProduct> {
    const produto = await this.prisma.loanProduct.findFirst({
      where: {
        consignatariaId,
        valorMinimo: { lte: valor },
        valorMaximo: { gte: valor },
        prazoMinimo: { lte: prazo },
        prazoMaximo: { gte: prazo },
        active: true,
      },
    });

    if (!produto) {
      throw new Error('Nenhum produto encontrado com os critérios informados');
    }

    return produto;
  }

  private async calculateSimulation(
    valor: number,
    prazo: number,
    produto: LoanProduct,
    margemMaxima: number,
  ): Promise<LoanSimulation> {
    // Calcula IOF
    const iof = this.calculateIOF(valor, prazo, produto.taxaIof);

    // Calcula valor total com IOF e tarifas
    const valorTotal = valor + iof + this.sumFees(produto.tarifas);

    // Calcula parcela usando Price
    const valorParcela = this.calculatePMT(
      valorTotal,
      prazo,
      produto.taxaJuros,
    );

    // Valida margem
    if (valorParcela > margemMaxima) {
      throw new Error('Valor da parcela excede a margem disponível');
    }

    // Calcula CET
    const cet = this.calculateCET(
      valor,
      valorParcela,
      prazo,
      produto.tarifas,
      iof,
    );

    // Gera tabela Price
    const parcelas = this.generateAmortizationTable(
      valorTotal,
      prazo,
      produto.taxaJuros,
      valorParcela,
    );

    return {
      id: crypto.randomUUID(),
      valorSolicitado: valor,
      prazo,
      taxaJuros: produto.taxaJuros,
      valorParcela,
      valorTotal,
      cet,
      iof,
      tarifas: produto.tarifas,
      parcelas,
      createdAt: new Date(),
    } as LoanSimulation;
  }

  private calculateIOF(
    valor: number,
    prazo: number,
    taxa: number,
  ): number {
    // Implementar cálculo de IOF conforme regulamentação
    const iofDiario = valor * 0.0082 * prazo;
    const iofAdicional = valor * 0.0038;
    return iofDiario + iofAdicional;
  }

  private sumFees(tarifas: any[]): number {
    return tarifas.reduce((sum, fee) => sum + fee.valor, 0);
  }

  private calculatePMT(
    valor: number,
    prazo: number,
    taxaJuros: number,
  ): number {
    const taxa = taxaJuros / 100;
    return (
      (valor * taxa * Math.pow(1 + taxa, prazo)) /
      (Math.pow(1 + taxa, prazo) - 1)
    );
  }

  private calculateCET(
    valor: number,
    parcela: number,
    prazo: number,
    tarifas: any[],
    iof: number,
  ): number {
    // Implementar cálculo do CET usando Newton-Raphson
    let cet = taxaJuros;
    const tolerance = 0.0001;
    let iteration = 0;

    while (iteration < 100) {
      const f = this.calculateNPV(valor, parcela, prazo, cet);
      const df = this.calculateNPVDerivative(valor, parcela, prazo, cet);

      const delta = f / df;
      cet = cet - delta;

      if (Math.abs(delta) < tolerance) {
        break;
      }

      iteration++;
    }

    return cet * 100;
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

  private generateAmortizationTable(
    valor: number,
    prazo: number,
    taxaJuros: number,
    valorParcela: number,
  ): LoanInstallment[] {
    const parcelas: LoanInstallment[] = [];
    let saldoDevedor = valor;
    const taxa = taxaJuros / 100;

    for (let i = 1; i <= prazo; i++) {
      const juros = saldoDevedor * taxa;
      const amortizacao = valorParcela - juros;
      saldoDevedor -= amortizacao;

      parcelas.push({
        numero: i,
        vencimento: this.calculateDueDate(i),
        valorParcela,
        amortizacao,
        juros,
        saldoDevedor: Math.max(0, saldoDevedor),
      });
    }

    return parcelas;
  }

  private calculateDueDate(parcela: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + parcela);
    return date;
  }

  private async calculateSaldoDevedor(contrato: any): Promise<number> {
    const parcelasPagas = await this.prisma.desconto.count({
      where: {
        contratoId: contrato.id,
        status: 'PAID',
      },
    });

    return this.calculateRemainingBalance(
      contrato.valorTotal,
      contrato.valorParcela,
      contrato.numeroParcelas,
      parcelasPagas,
      contrato.taxaJuros,
    );
  }

  private calculateRemainingBalance(
    valorTotal: number,
    valorParcela: number,
    totalParcelas: number,
    parcelasPagas: number,
    taxaJuros: number,
  ): number {
    const taxa = taxaJuros / 100;
    let saldoDevedor = valorTotal;

    for (let i = 0; i < parcelasPagas; i++) {
      const juros = saldoDevedor * taxa;
      const amortizacao = valorParcela - juros;
      saldoDevedor -= amortizacao;
    }

    return Math.max(0, saldoDevedor);
  }

  private calculatePresentValue(
    valorParcela: number,
    prazo: number,
    taxaJuros: number,
  ): number {
    const taxa = taxaJuros / 100;
    let vp = 0;

    for (let i = 1; i <= prazo; i++) {
      vp += valorParcela / Math.pow(1 + taxa, i);
    }

    return vp;
  }

  private calculateRefinancingEconomy(
    contratoAtual: any,
    simulacao: LoanSimulation,
  ): number {
    const totalAtual = contratoAtual.valorParcela * contratoAtual.parcelasRestantes;
    const totalNovo = simulacao.valorParcela * simulacao.prazo;
    return totalAtual - totalNovo;
  }

  private calculatePortabilityEconomy(
    contratoOrigem: any,
    simulacao: LoanSimulation,
  ): number {
    const totalOrigem = contratoOrigem.valorParcela * contratoOrigem.parcelasRestantes;
    const totalDestino = simulacao.valorParcela * simulacao.prazo;
    return totalOrigem - totalDestino;
  }
}
