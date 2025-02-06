import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefinanciamentoRepository } from '../repositories/refinanciamento.repository';
import { ContratoRepository } from '../repositories/contrato.repository';
import { ServidorRepository } from '../repositories/servidor.repository';
import { DocumentoService } from './documento.service';
import { AuditoriaService } from './auditoria.service';
import { BancoIntegrationFactory } from './bancos/banco-integration.factory';
import {
  StatusRefinanciamento,
  TipoRecusaRefinanciamento,
  ISimulacaoRefinanciamento,
  IRefinanciamentoMetadata
} from '../domain/refinanciamento/refinanciamento.types';
import {
  SimularRefinanciamentoDTO,
  CriarRefinanciamentoDTO,
  AtualizarRefinanciamentoDTO,
  AnalisarRefinanciamentoDTO,
  ListarRefinanciamentosDTO
} from '../dtos/refinanciamento/refinanciamento.dto';

@Injectable()
export class RefinanciamentoService {
  private readonly PARCELAS_MINIMAS = 6;
  private readonly MARGEM_MINIMA = 0.3;
  private readonly TAXA_MAXIMA_AUMENTO = 0.2;

  constructor(
    private readonly refinanciamentoRepository: RefinanciamentoRepository,
    private readonly contratoRepository: ContratoRepository,
    private readonly servidorRepository: ServidorRepository,
    private readonly documentoService: DocumentoService,
    private readonly auditoriaService: AuditoriaService,
    private readonly configService: ConfigService,
    private readonly bancoIntegrationFactory: BancoIntegrationFactory
  ) {}

  async simular(dto: SimularRefinanciamentoDTO): Promise<ISimulacaoRefinanciamento> {
    const contrato = await this.contratoRepository.buscarPorId(dto.contratoId);
    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    // Validar número mínimo de parcelas pagas
    if (dto.parcelasPagas < this.PARCELAS_MINIMAS) {
      throw new BadRequestException(
        `É necessário ter no mínimo ${this.PARCELAS_MINIMAS} parcelas pagas para realizar o refinanciamento`
      );
    }

    // Obter integração com o banco
    const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(contrato.bancoId);

    // Simular no banco
    const simulacaoBanco = await bancoIntegracao.simularRefinanciamento(
      dto.contratoId,
      dto.saldoDevedor,
      dto.prazoTotal
    );

    // Calcular valores e economia
    const valorTotalAtual = dto.valorParcela * dto.prazoTotal;
    const valorTotalNovo = simulacaoBanco.valorParcela * simulacaoBanco.prazo;

    return {
      ...dto,
      economia: {
        valorTotalAtual,
        valorTotalNovo,
        economiaTotal: valorTotalAtual - valorTotalNovo,
        economiaMensal: dto.valorParcela - simulacaoBanco.valorParcela,
        reducaoTaxa: dto.taxaJuros - simulacaoBanco.taxaJuros
      }
    };
  }

  async criar(dto: CriarRefinanciamentoDTO, usuarioId: number) {
    // Validar contrato
    const contrato = await this.contratoRepository.buscarPorId(dto.contratoId);
    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    // Validar se já existe refinanciamento em andamento
    const refinanciamentoExistente = await this.refinanciamentoRepository.buscarPorContrato(dto.contratoId);
    if (refinanciamentoExistente) {
      throw new BadRequestException('Já existe um refinanciamento em andamento para este contrato');
    }

    // Validar servidor
    const servidor = await this.servidorRepository.buscarPorId(dto.servidorId);
    if (!servidor) {
      throw new NotFoundException('Servidor não encontrado');
    }

    // Validar margem
    const margemDisponivel = servidor.margemConsignavel - dto.valorParcela;
    if (margemDisponivel < 0) {
      throw new BadRequestException('Margem consignável insuficiente');
    }

    // Validar taxa de juros
    if (dto.taxaJurosNova > dto.taxaJurosAtual * (1 + this.TAXA_MAXIMA_AUMENTO)) {
      throw new BadRequestException('Nova taxa de juros muito alta em relação à taxa atual');
    }

    // Obter integração com o banco
    const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(dto.bancoId);

    // Solicitar refinanciamento no banco
    const solicitacao = await bancoIntegracao.solicitarRefinanciamento(
      dto.contratoId,
      dto.saldoDevedor,
      dto.prazoTotal,
      dto.documentos
    );

    // Criar metadata
    const metadata: IRefinanciamentoMetadata = {
      historicoTentativas: [{
        data: new Date(),
        status: StatusRefinanciamento.AGUARDANDO_ANALISE,
        observacoes: 'Refinanciamento criado'
      }],
      validacoes: {
        parcelasPagasSuficientes: dto.parcelasPagas >= this.PARCELAS_MINIMAS,
        margemSuficiente: margemDisponivel >= 0,
        idadePermitida: true,
        documentacaoCompleta: dto.documentos && dto.documentos.length > 0,
        restricaoCadastral: false
      },
      integracao: {
        protocolo: solicitacao.protocolo,
        dataProcessamento: solicitacao.dataProcessamento
      }
    };

    // Criar refinanciamento
    const refinanciamento = await this.refinanciamentoRepository.criar({
      ...dto,
      usuarioId,
      status: solicitacao.status,
      protocoloBanco: solicitacao.protocolo,
      metadata
    });

    // Registrar auditoria
    await this.auditoriaService.registrar({
      entidade: 'Refinanciamento',
      entidadeId: refinanciamento.id,
      acao: 'criar',
      usuarioId,
      dados: dto
    });

    return refinanciamento;
  }

  async atualizar(id: string, dto: AtualizarRefinanciamentoDTO, usuarioId: number) {
    const refinanciamento = await this.refinanciamentoRepository.buscarPorId(id);
    if (!refinanciamento) {
      throw new NotFoundException('Refinanciamento não encontrado');
    }

    // Validar status
    if (![
      StatusRefinanciamento.AGUARDANDO_ANALISE,
      StatusRefinanciamento.EM_ANALISE
    ].includes(refinanciamento.status as StatusRefinanciamento)) {
      throw new BadRequestException('Refinanciamento não pode ser atualizado no status atual');
    }

    // Atualizar no banco se necessário
    if (dto.documentos) {
      const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(refinanciamento.bancoId);
      await bancoIntegracao.solicitarRefinanciamento(
        refinanciamento.contratoId,
        refinanciamento.saldoDevedor,
        refinanciamento.prazoTotal,
        dto.documentos
      );
    }

    // Atualizar metadata
    const metadata = {
      ...refinanciamento.metadata,
      historicoTentativas: [
        ...refinanciamento.metadata.historicoTentativas,
        {
          data: new Date(),
          status: refinanciamento.status,
          observacoes: dto.observacoes || 'Refinanciamento atualizado'
        }
      ]
    };

    // Atualizar refinanciamento
    const refinanciamentoAtualizado = await this.refinanciamentoRepository.atualizar(id, {
      ...dto,
      metadata
    });

    // Registrar auditoria
    await this.auditoriaService.registrar({
      entidade: 'Refinanciamento',
      entidadeId: id,
      acao: 'atualizar',
      usuarioId,
      dados: dto
    });

    return refinanciamentoAtualizado;
  }

  async analisar(id: string, dto: AnalisarRefinanciamentoDTO, usuarioId: number) {
    const refinanciamento = await this.refinanciamentoRepository.buscarPorId(id);
    if (!refinanciamento) {
      throw new NotFoundException('Refinanciamento não encontrado');
    }

    // Validar transição de status
    this.validarTransicaoStatus(refinanciamento.status as StatusRefinanciamento, dto.status);

    // Consultar status no banco
    const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(refinanciamento.bancoId);
    const statusBanco = await bancoIntegracao.consultarRefinanciamento(refinanciamento.protocoloBanco);

    // Atualizar refinanciamento
    const refinanciamentoAtualizado = await this.refinanciamentoRepository.atualizarStatus(
      id,
      statusBanco.status,
      statusBanco.motivoRecusa,
      statusBanco.observacoes
    );

    // Registrar auditoria
    await this.auditoriaService.registrar({
      entidade: 'Refinanciamento',
      entidadeId: id,
      acao: 'analisar',
      usuarioId,
      dados: dto
    });

    return refinanciamentoAtualizado;
  }

  async listar(filtros: ListarRefinanciamentosDTO) {
    return this.refinanciamentoRepository.listarPorFiltros(filtros);
  }

  async obterEstatisticas(filtros: ListarRefinanciamentosDTO) {
    return this.refinanciamentoRepository.obterEstatisticas(filtros);
  }

  private validarTransicaoStatus(statusAtual: StatusRefinanciamento, novoStatus: StatusRefinanciamento) {
    const transicoesValidas = {
      [StatusRefinanciamento.AGUARDANDO_ANALISE]: [
        StatusRefinanciamento.EM_ANALISE,
        StatusRefinanciamento.CANCELADO
      ],
      [StatusRefinanciamento.EM_ANALISE]: [
        StatusRefinanciamento.APROVADO,
        StatusRefinanciamento.REPROVADO,
        StatusRefinanciamento.CANCELADO
      ],
      [StatusRefinanciamento.APROVADO]: [
        StatusRefinanciamento.EM_PROCESSAMENTO,
        StatusRefinanciamento.CANCELADO
      ],
      [StatusRefinanciamento.EM_PROCESSAMENTO]: [
        StatusRefinanciamento.CONCLUIDO,
        StatusRefinanciamento.ERRO
      ]
    };

    if (
      !transicoesValidas[statusAtual] ||
      !transicoesValidas[statusAtual].includes(novoStatus)
    ) {
      throw new BadRequestException(`Transição de status inválida: ${statusAtual} -> ${novoStatus}`);
    }
  }
}
