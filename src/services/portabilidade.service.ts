import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PortabilidadeRepository } from '../repositories/portabilidade.repository';
import { ContratoRepository } from '../repositories/contrato.repository';
import { ServidorRepository } from '../repositories/servidor.repository';
import { DocumentoService } from './documento.service';
import { AuditoriaService } from './auditoria.service';
import { BancoIntegrationFactory } from './banco-integration.factory';
import { 
  StatusPortabilidade,
  TipoRecusa,
  ISimulacaoPortabilidade,
  IPortabilidadeMetadata
} from '../domain/portabilidade/portabilidade.types';
import {
  SimularPortabilidadeDTO,
  CriarPortabilidadeDTO,
  AtualizarPortabilidadeDTO,
  AnalisarPortabilidadeDTO,
  FiltrarPortabilidadeDTO
} from '../dtos/portabilidade/portabilidade.dto';

@Injectable()
export class PortabilidadeService {
  private readonly PARCELAS_MINIMAS = 12;
  private readonly MARGEM_MINIMA = 0.3;
  private readonly TAXA_MAXIMA_REDUCAO = 0.3;

  constructor(
    private readonly portabilidadeRepository: PortabilidadeRepository,
    private readonly contratoRepository: ContratoRepository,
    private readonly servidorRepository: ServidorRepository,
    private readonly documentoService: DocumentoService,
    private readonly auditoriaService: AuditoriaService,
    private readonly configService: ConfigService,
    private readonly bancoIntegrationFactory: BancoIntegrationFactory
  ) {}

  async simular(dto: SimularPortabilidadeDTO): Promise<ISimulacaoPortabilidade> {
    const contrato = await this.contratoRepository.buscarPorId(dto.contratoOrigemId);
    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    // Validar número mínimo de parcelas pagas
    if (dto.parcelasPagas < this.PARCELAS_MINIMAS) {
      throw new BadRequestException(
        `É necessário ter no mínimo ${this.PARCELAS_MINIMAS} parcelas pagas para realizar a portabilidade`
      );
    }

    // Obter integração com o banco
    const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(contrato.bancoId);

    // Simular no banco
    const simulacaoBanco = await bancoIntegracao.simularPortabilidade(
      dto.contratoOrigemId,
      dto.valorSaldoDevedor,
      dto.prazoRestante
    );

    // Calcular valores e economia
    const valorTotalAtual = dto.valorParcela * dto.prazoRestante;
    const valorTotalNovo = simulacaoBanco.valorParcela * simulacaoBanco.prazo;

    return {
      ...dto,
      economia: {
        valorTotalAtual,
        valorTotalNovo,
        economiaTotal: valorTotalAtual - valorTotalNovo,
        economiaMensal: dto.valorParcela - simulacaoBanco.valorParcela,
        reducaoTaxa: dto.taxaJurosAtual - simulacaoBanco.taxaJuros
      }
    };
  }

  async criar(dto: CriarPortabilidadeDTO, usuarioId: number) {
    // Validar contrato
    const contrato = await this.contratoRepository.buscarPorId(dto.contratoOrigemId);
    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    // Validar se já existe portabilidade em andamento
    const portabilidadeExistente = await this.portabilidadeRepository.buscarPorContratoOrigem(
      dto.contratoOrigemId
    );
    if (portabilidadeExistente) {
      throw new BadRequestException('Já existe uma portabilidade em andamento para este contrato');
    }

    // Validar servidor
    const servidor = await this.servidorRepository.buscarPorId(dto.servidorId);
    if (!servidor) {
      throw new NotFoundException('Servidor não encontrado');
    }

    // Validar margem
    const margemDisponivel = await this.calcularMargemDisponivel(servidor.id);
    if (margemDisponivel < (dto.valorParcela * this.MARGEM_MINIMA)) {
      throw new BadRequestException('Margem consignável insuficiente');
    }

    // Obter integração com o banco destino
    const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(dto.bancoDestinoId);

    // Solicitar portabilidade no banco
    const solicitacao = await bancoIntegracao.solicitarPortabilidade(
      dto.contratoOrigemId,
      dto.protocoloSimulacao,
      dto.documentos
    );

    // Criar metadata
    const metadata: IPortabilidadeMetadata = {
      historicoTentativas: [{
        data: new Date(),
        status: StatusPortabilidade.AGUARDANDO_ANALISE
      }],
      dadosFinanceiros: {
        margemConsignavel: servidor.margemConsignavel,
        margemDisponivel,
        salarioBruto: servidor.salarioBruto
      },
      validacoes: {
        parcelasMinimas: dto.parcelasPagas >= this.PARCELAS_MINIMAS,
        margemDisponivel: true,
        taxaCompetitiva: dto.taxaJurosNova < dto.taxaJurosAtual,
        documentacaoCompleta: dto.documentos && dto.documentos.length > 0,
        restricaoCadastral: false
      },
      integracao: {
        protocolo: solicitacao.protocolo,
        dataProcessamento: solicitacao.dataProcessamento
      }
    };

    // Criar portabilidade
    const portabilidade = await this.portabilidadeRepository.criar({
      ...dto,
      usuarioId,
      status: solicitacao.status,
      protocoloBanco: solicitacao.protocolo,
      metadata
    });

    // Registrar auditoria
    await this.auditoriaService.registrar({
      entidadeId: portabilidade.id,
      entidadeTipo: 'PORTABILIDADE',
      operacao: 'CRIAR',
      usuarioId,
      payload: dto
    });

    return portabilidade;
  }

  async atualizar(id: string, dto: AtualizarPortabilidadeDTO, usuarioId: number) {
    const portabilidade = await this.portabilidadeRepository.buscarPorId(id);
    if (!portabilidade) {
      throw new NotFoundException('Portabilidade não encontrada');
    }

    // Validar status
    if (![StatusPortabilidade.AGUARDANDO_ANALISE, StatusPortabilidade.EM_ANALISE]
        .includes(portabilidade.status as StatusPortabilidade)) {
      throw new BadRequestException('Portabilidade não pode ser atualizada no status atual');
    }

    // Atualizar no banco se necessário
    if (dto.documentos) {
      const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(portabilidade.bancoDestinoId);
      await bancoIntegracao.solicitarPortabilidade(
        portabilidade.contratoOrigemId,
        portabilidade.protocoloBanco,
        dto.documentos
      );
    }

    // Atualizar portabilidade
    const portabilidadeAtualizada = await this.portabilidadeRepository.atualizar(id, {
      ...dto,
      metadata: {
        ...portabilidade.metadata,
        historicoTentativas: [
          ...(portabilidade.metadata?.historicoTentativas || []),
          {
            data: new Date(),
            status: portabilidade.status,
            observacoes: dto.observacoes
          }
        ]
      }
    });

    // Registrar auditoria
    await this.auditoriaService.registrar({
      entidadeId: id,
      entidadeTipo: 'PORTABILIDADE',
      operacao: 'ATUALIZAR',
      usuarioId,
      payload: dto
    });

    return portabilidadeAtualizada;
  }

  async analisar(id: string, dto: AnalisarPortabilidadeDTO, usuarioId: number) {
    const portabilidade = await this.portabilidadeRepository.buscarPorId(id);
    if (!portabilidade) {
      throw new NotFoundException('Portabilidade não encontrada');
    }

    // Validar transição de status
    this.validarTransicaoStatus(portabilidade.status as StatusPortabilidade, dto.status);

    // Consultar status no banco
    const bancoIntegracao = this.bancoIntegrationFactory.getIntegracao(portabilidade.bancoDestinoId);
    const statusBanco = await bancoIntegracao.consultarPortabilidade(portabilidade.protocoloBanco);

    // Atualizar com status do banco
    const portabilidadeAtualizada = await this.portabilidadeRepository.atualizarStatus(
      id,
      statusBanco.status,
      statusBanco.motivoRecusa,
      statusBanco.observacoes
    );

    // Registrar auditoria
    await this.auditoriaService.registrar({
      entidadeId: id,
      entidadeTipo: 'PORTABILIDADE',
      operacao: 'ANALISAR',
      usuarioId,
      payload: dto
    });

    return portabilidadeAtualizada;
  }

  async listar(filtros: FiltrarPortabilidadeDTO) {
    const [portabilidades, total] = await Promise.all([
      this.portabilidadeRepository.listarPorFiltros(filtros),
      this.portabilidadeRepository.contarPorFiltros(filtros)
    ]);

    return {
      portabilidades,
      total,
      filtros
    };
  }

  async obterEstatisticas() {
    return this.portabilidadeRepository.obterEstatisticas();
  }

  private async calcularMargemDisponivel(servidorId: number): Promise<number> {
    const servidor = await this.servidorRepository.buscarPorId(servidorId);
    if (!servidor) {
      throw new NotFoundException('Servidor não encontrado');
    }

    // Aqui você implementaria a lógica específica de cálculo de margem
    // Este é apenas um exemplo simplificado
    return servidor.margemConsignavel;
  }

  private calcularValorTotal(principal: number, taxaJuros: number, prazo: number): number {
    // Implementar cálculo financeiro real
    // Este é apenas um exemplo simplificado
    const taxaMensal = taxaJuros / 12 / 100;
    const fator = Math.pow(1 + taxaMensal, prazo);
    return principal * ((taxaMensal * fator) / (fator - 1)) * prazo;
  }

  private validarTransicaoStatus(statusAtual: StatusPortabilidade, novoStatus: StatusPortabilidade) {
    const transicoesValidas = {
      [StatusPortabilidade.AGUARDANDO_ANALISE]: [
        StatusPortabilidade.EM_ANALISE,
        StatusPortabilidade.CANCELADA
      ],
      [StatusPortabilidade.EM_ANALISE]: [
        StatusPortabilidade.APROVADA,
        StatusPortabilidade.REPROVADA,
        StatusPortabilidade.CANCELADA
      ],
      [StatusPortabilidade.APROVADA]: [
        StatusPortabilidade.EM_PROCESSAMENTO,
        StatusPortabilidade.CANCELADA
      ],
      [StatusPortabilidade.EM_PROCESSAMENTO]: [
        StatusPortabilidade.CONCLUIDA,
        StatusPortabilidade.ERRO,
        StatusPortabilidade.CANCELADA
      ]
    };

    if (!transicoesValidas[statusAtual]?.includes(novoStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${statusAtual} -> ${novoStatus}`
      );
    }
  }
}
