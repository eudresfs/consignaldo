import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MargemService } from '../margem.service';
import { ValidacaoService } from '../validacao.service';
import {
  LoanSimulation,
  RefinanceSimulation,
  PortabilitySimulation,
  LoanInstallment,
} from '../../domain/interfaces/loan-simulation.interface';
import { MargemInsuficienteException } from '../../exceptions/margem-insuficiente.exception';
import { PrazoInvalidoException } from '../../exceptions/prazo-invalido.exception';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class LoanSimulationService {
  private readonly logger = new Logger(LoanSimulationService.name);
  private readonly MARGEM_MAXIMA = 0.3;
  private readonly IOF_DIARIO = 0.0082;
  private readonly IOF_ADICIONAL = 0.38;

  constructor(
    private readonly prisma: PrismaService,
    private readonly margemService: MargemService,
    private readonly validacaoService: ValidacaoService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async simulateNewLoan(
    servidorId: number,
    consignatariaId: number,
    valorSolicitado: number,
    prazo: number,
  ): Promise<LoanSimulation> {
    const cacheKey = `loan_sim_${servidorId}_${consignatariaId}_${valorSolicitado}_${prazo}`;
    const cached = await this.cacheManager.get<LoanSimulation>(cacheKey);
    if (cached) {
      return cached;
    }

    const [servidor, produto] = await Promise.all([
      this.prisma.servidor.findUnique({ where: { id: servidorId } }),
      this.prisma.produto.findFirst({
        where: {
          consignatariaId,
          prazoMinimo: { lte: prazo },
          prazoMaximo: { gte: prazo },
          valorMinimo: { lte: valorSolicitado },
          valorMaximo: { gte: valorSolicitado },
          active: true,
        },
      }),
    ]);

    if (!produto) {
      throw new PrazoInvalidoException({
        prazo,
        valor: valorSolicitado,
      });
    }

    const simulation = await this.calculateLoanTerms(
      valorSolicitado,
      prazo,
      produto.taxaJuros,
      servidor,
    );

    await this.cacheManager.set(cacheKey, simulation, 3600000); // Cache por 1 hora
    return simulation;
  }

  async simulateRefinance(
    contratoId: string,
    valorSolicitado: number,
    prazo: number,
  ): Promise<RefinanceSimulation> {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: { servidor: true },
    });

    if (!contrato) {
      throw new Error('Contrato não encontrado');
    }

    const simulation = await this.calculateLoanTerms(
      valorSolicitado,
      prazo,
      contrato.taxaJuros,
      contrato.servidor,
    );

    const economiaTotal = this.calculateRefinanceEconomy(
      contrato,
      simulation,
    );

    return {
      ...simulation,
      contratoId,
      saldoDevedor: contrato.saldoDevedor,
      valorLiquidacao: contrato.saldoDevedor,
      valorDisponivel: valorSolicitado - contrato.saldoDevedor,
      economiaTotal,
    };
  }

  async simulatePortability(
    contratoOrigemId: string,
    bancoOrigemId: number,
    prazo: number,
  ): Promise<PortabilitySimulation> {
    const contratoOrigem = await this.prisma.contrato.findUnique({
      where: { id: contratoOrigemId },
      include: { servidor: true },
    });

    if (!contratoOrigem) {
      throw new Error('Contrato de origem não encontrado');
    }

    const simulation = await this.calculateLoanTerms(
      contratoOrigem.saldoDevedor,
      prazo,
      contratoOrigem.taxaJuros * 0.7, // Taxa 30% menor
      contratoOrigem.servidor,
    );

    const valorPresenteParcelas = this.calculatePresentValue(
      contratoOrigem.parcela,
      contratoOrigem.prazo,
      contratoOrigem.taxaJuros,
    );

    return {
      ...simulation,
      contratoOrigemId,
      bancoOrigemId,
      saldoDevedor: contratoOrigem.saldoDevedor,
      valorPresenteParcelas,
      economiaTotal: this.calculatePortabilityEconomy(
        contratoOrigem,
        simulation,
        valorPresenteParcelas,
      ),
    };
  }

  private async calculateLoanTerms(
    valorSolicitado: number,
    prazo: number,
    taxaJuros: number,
    servidor: any,
  ): Promise<LoanSimulation> {
    const taxaMensal = taxaJuros / 100;
    const valorParcela = this.calculateInstallment(
      valorSolicitado,
      prazo,
      taxaMensal,
    );

    await this.validateMargin(servidor, valorParcela);

    const parcelas = this.generateInstallments(
      valorSolicitado,
      prazo,
      taxaMensal,
      valorParcela,
    );

    const iof = this.calculateIOF(valorSolicitado, prazo);
    const cet = this.calculateCET(
      valorSolicitado,
      valorParcela,
      prazo,
      iof,
    );

    return {
      id: undefined,
      servidorId: servidor.id,
      consignatariaId: undefined,
      valorSolicitado,
      prazo,
      taxaJuros,
      valorParcela,
      valorTotal: valorParcela * prazo,
      cet,
      iof,
      tarifas: [],
      parcelas,
      createdAt: new Date(),
    };
  }

  private async validateMargin(servidor: any, valorParcela: number) {
    const margemDisponivel = await this.margemService.calcularMargemDisponivel(
      servidor.id,
    );

    if (valorParcela > margemDisponivel) {
      throw new MargemInsuficienteException({
        margem: margemDisponivel,
        parcela: valorParcela,
        matricula: servidor.matricula,
      });
    }

    const margemMaxima = servidor.salarioBruto * this.MARGEM_MAXIMA;
    const margemUtilizada = await this.margemService.calcularMargemUtilizada(
      servidor.id,
    );

    if (margemUtilizada + valorParcela > margemMaxima) {
      throw new MargemInsuficienteException({
        margem: margemMaxima - margemUtilizada,
        parcela: valorParcela,
        matricula: servidor.matricula,
      });
    }
  }

  private calculateInstallment(
    valor: number,
    prazo: number,
    taxaMensal: number,
  ): number {
    const fator = Math.pow(1 + taxaMensal, prazo);
    return (valor * taxaMensal * fator) / (fator - 1);
  }

  private generateInstallments(
    valor: number,
    prazo: number,
    taxaMensal: number,
    valorParcela: number,
  ): LoanInstallment[] {
    const parcelas: LoanInstallment[] = [];
    let saldoDevedor = valor;
    const hoje = new Date();

    for (let i = 1; i <= prazo; i++) {
      const juros = saldoDevedor * taxaMensal;
      const amortizacao = valorParcela - juros;
      saldoDevedor -= amortizacao;

      const vencimento = new Date(hoje);
      vencimento.setMonth(hoje.getMonth() + i);

      parcelas.push({
        numero: i,
        vencimento,
        valorParcela,
        amortizacao,
        juros,
        saldoDevedor: Math.max(0, saldoDevedor),
      });
    }

    return parcelas;
  }

  private calculateIOF(valor: number, prazo: number): number {
    const diasTotais = prazo * 30;
    const iofDiario = valor * this.IOF_DIARIO * diasTotais;
    const iofAdicional = valor * this.IOF_ADICIONAL;
    return iofDiario + iofAdicional;
  }

  private calculateCET(
    valor: number,
    valorParcela: number,
    prazo: number,
    iof: number,
  ): number {
    // Implementação do Newton-Raphson para encontrar a taxa CET
    let taxa = 0.02; // Chute inicial
    const precisao = 0.0001;
    const maxIteracoes = 100;
    let iteracao = 0;

    while (iteracao < maxIteracoes) {
      let f = -valor - iof;
      let df = 0;

      for (let i = 1; i <= prazo; i++) {
        f += valorParcela / Math.pow(1 + taxa, i);
        df += (-i * valorParcela) / Math.pow(1 + taxa, i + 1);
      }

      const novaTaxa = taxa - f / df;
      if (Math.abs(novaTaxa - taxa) < precisao) {
        return novaTaxa * 100;
      }

      taxa = novaTaxa;
      iteracao++;
    }

    return taxa * 100;
  }

  private calculatePresentValue(
    valorParcela: number,
    prazo: number,
    taxaJuros: number,
  ): number {
    const taxaMensal = taxaJuros / 100;
    let valorPresente = 0;

    for (let i = 1; i <= prazo; i++) {
      valorPresente += valorParcela / Math.pow(1 + taxaMensal, i);
    }

    return valorPresente;
  }

  private calculateRefinanceEconomy(
    contratoOriginal: any,
    novaSimulacao: LoanSimulation,
  ): number {
    const totalOriginal = contratoOriginal.parcela * contratoOriginal.prazo;
    const totalNovo = novaSimulacao.valorParcela * novaSimulacao.prazo;
    return totalOriginal - totalNovo;
  }

  private calculatePortabilityEconomy(
    contratoOrigem: any,
    novaSimulacao: LoanSimulation,
    valorPresenteParcelas: number,
  ): number {
    const totalOriginal = contratoOrigem.parcela * contratoOrigem.prazo;
    const totalNovo = novaSimulacao.valorParcela * novaSimulacao.prazo;
    return totalOriginal - totalNovo + (valorPresenteParcelas - contratoOrigem.saldoDevedor);
  }
}
