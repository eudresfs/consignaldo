import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MargemService } from '../margem.service';
import { ValidacaoService } from '../validacao.service';
import { NotificationService } from '../notification.service';
import { BankIntegrationService } from '../bank-integration.service';
import { 
  LoanSimulation,
  RefinanceSimulation,
  PortabilitySimulation,
} from '../../domain/interfaces/loan-simulation.interface';
import { StatusContrato } from '../../domain/enums/status-contrato.enum';
import { MargemInsuficienteException } from '../../exceptions/margem-insuficiente.exception';
import { PrazoInvalidoException } from '../../exceptions/prazo-invalido.exception';

@Injectable()
export class LoanProcessorService {
  private readonly logger = new Logger(LoanProcessorService.name);
  private readonly MARGEM_MAXIMA = 0.3; // 30% do salário

  constructor(
    private readonly prisma: PrismaService,
    private readonly margemService: MargemService,
    private readonly validacaoService: ValidacaoService,
    private readonly notificationService: NotificationService,
    private readonly bankIntegration: BankIntegrationService,
  ) {}

  async processNewLoan(simulacao: LoanSimulation) {
    const servidor = await this.prisma.servidor.findUnique({
      where: { id: simulacao.servidorId },
    });

    await this.validarMargem(servidor, simulacao.valorParcela);
    await this.validarProduto(simulacao);

    const proposta = await this.criarProposta(simulacao);
    await this.bankIntegration.exportProposal(proposta.id);

    return proposta;
  }

  async processRefinance(simulacao: RefinanceSimulation) {
    const contratoOriginal = await this.prisma.contrato.findUnique({
      where: { id: simulacao.contratoId },
      include: { servidor: true },
    });

    if (!contratoOriginal) {
      throw new Error('Contrato original não encontrado');
    }

    await this.validarContratoRefinanciamento(contratoOriginal);
    await this.validarMargem(
      contratoOriginal.servidor,
      simulacao.valorParcela - contratoOriginal.parcela,
    );

    const proposta = await this.criarPropostaRefinanciamento(
      simulacao,
      contratoOriginal,
    );
    await this.bankIntegration.exportProposal(proposta.id);

    return proposta;
  }

  async processPortability(simulacao: PortabilitySimulation) {
    const contratoOrigem = await this.prisma.contrato.findUnique({
      where: { id: simulacao.contratoOrigemId },
      include: { servidor: true },
    });

    if (!contratoOrigem) {
      throw new Error('Contrato de origem não encontrado');
    }

    await this.validarContratoPortabilidade(contratoOrigem);
    await this.validarMargem(
      contratoOrigem.servidor,
      simulacao.valorParcela - contratoOrigem.parcela,
    );

    const proposta = await this.criarPropostaPortabilidade(
      simulacao,
      contratoOrigem,
    );
    await this.bankIntegration.exportProposal(proposta.id);

    return proposta;
  }

  private async validarMargem(servidor: any, valorParcela: number) {
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

  private async validarProduto(simulacao: LoanSimulation) {
    const produto = await this.prisma.produto.findFirst({
      where: {
        consignatariaId: simulacao.consignatariaId,
        prazoMinimo: { lte: simulacao.prazo },
        prazoMaximo: { gte: simulacao.prazo },
        valorMinimo: { lte: simulacao.valorSolicitado },
        valorMaximo: { gte: simulacao.valorSolicitado },
        active: true,
      },
    });

    if (!produto) {
      throw new PrazoInvalidoException({
        prazo: simulacao.prazo,
        valor: simulacao.valorSolicitado,
      });
    }

    if (Math.abs(produto.taxaJuros - simulacao.taxaJuros) > 0.0001) {
      throw new Error('Taxa de juros divergente do produto');
    }
  }

  private async validarContratoRefinanciamento(contrato: any) {
    if (contrato.status !== StatusContrato.AVERBADO) {
      throw new Error('Contrato não está ativo para refinanciamento');
    }

    const parcelasRestantes = await this.prisma.parcela.count({
      where: {
        contratoId: contrato.id,
        status: 'ABERTO',
      },
    });

    if (parcelasRestantes < 6) {
      throw new Error('Contrato deve ter no mínimo 6 parcelas em aberto');
    }
  }

  private async validarContratoPortabilidade(contrato: any) {
    if (contrato.status !== StatusContrato.AVERBADO) {
      throw new Error('Contrato não está ativo para portabilidade');
    }

    const parcelasRestantes = await this.prisma.parcela.count({
      where: {
        contratoId: contrato.id,
        status: 'ABERTO',
      },
    });

    if (parcelasRestantes < 12) {
      throw new Error('Contrato deve ter no mínimo 12 parcelas em aberto');
    }
  }

  private async criarProposta(simulacao: LoanSimulation) {
    return this.prisma.proposta.create({
      data: {
        tipo: 'NOVO',
        status: 'AGUARDANDO',
        servidorId: simulacao.servidorId,
        consignatariaId: simulacao.consignatariaId,
        valorSolicitado: simulacao.valorSolicitado,
        prazo: simulacao.prazo,
        taxaJuros: simulacao.taxaJuros,
        valorParcela: simulacao.valorParcela,
        valorTotal: simulacao.valorTotal,
        cet: simulacao.cet,
        iof: simulacao.iof,
        tarifas: {
          create: simulacao.tarifas.map(t => ({
            descricao: t.descricao,
            valor: t.valor,
          })),
        },
        parcelas: {
          create: simulacao.parcelas.map(p => ({
            numero: p.numero,
            vencimento: p.vencimento,
            valorParcela: p.valorParcela,
            amortizacao: p.amortizacao,
            juros: p.juros,
            saldoDevedor: p.saldoDevedor,
          })),
        },
      },
    });
  }

  private async criarPropostaRefinanciamento(
    simulacao: RefinanceSimulation,
    contratoOriginal: any,
  ) {
    return this.prisma.proposta.create({
      data: {
        tipo: 'REFINANCIAMENTO',
        status: 'AGUARDANDO',
        servidorId: simulacao.servidorId,
        consignatariaId: simulacao.consignatariaId,
        contratoOrigemId: contratoOriginal.id,
        valorSolicitado: simulacao.valorSolicitado,
        prazo: simulacao.prazo,
        taxaJuros: simulacao.taxaJuros,
        valorParcela: simulacao.valorParcela,
        valorTotal: simulacao.valorTotal,
        cet: simulacao.cet,
        iof: simulacao.iof,
        saldoDevedor: simulacao.saldoDevedor,
        valorLiquidacao: simulacao.valorLiquidacao,
        valorDisponivel: simulacao.valorDisponivel,
        economiaTotal: simulacao.economiaTotal,
        tarifas: {
          create: simulacao.tarifas.map(t => ({
            descricao: t.descricao,
            valor: t.valor,
          })),
        },
        parcelas: {
          create: simulacao.parcelas.map(p => ({
            numero: p.numero,
            vencimento: p.vencimento,
            valorParcela: p.valorParcela,
            amortizacao: p.amortizacao,
            juros: p.juros,
            saldoDevedor: p.saldoDevedor,
          })),
        },
      },
    });
  }

  private async criarPropostaPortabilidade(
    simulacao: PortabilitySimulation,
    contratoOrigem: any,
  ) {
    return this.prisma.proposta.create({
      data: {
        tipo: 'PORTABILIDADE',
        status: 'AGUARDANDO',
        servidorId: simulacao.servidorId,
        consignatariaId: simulacao.consignatariaId,
        contratoOrigemId: contratoOrigem.id,
        bancoOrigemId: simulacao.bancoOrigemId,
        valorSolicitado: simulacao.valorSolicitado,
        prazo: simulacao.prazo,
        taxaJuros: simulacao.taxaJuros,
        valorParcela: simulacao.valorParcela,
        valorTotal: simulacao.valorTotal,
        cet: simulacao.cet,
        iof: simulacao.iof,
        saldoDevedor: simulacao.saldoDevedor,
        valorPresenteParcelas: simulacao.valorPresenteParcelas,
        economiaTotal: simulacao.economiaTotal,
        tarifas: {
          create: simulacao.tarifas.map(t => ({
            descricao: t.descricao,
            valor: t.valor,
          })),
        },
        parcelas: {
          create: simulacao.parcelas.map(p => ({
            numero: p.numero,
            vencimento: p.vencimento,
            valorParcela: p.valorParcela,
            amortizacao: p.amortizacao,
            juros: p.juros,
            saldoDevedor: p.saldoDevedor,
          })),
        },
      },
    });
  }
}
