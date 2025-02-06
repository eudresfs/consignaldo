import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ITransacaoBancaria, IResultadoConciliacao, StatusConciliacao } from '../domain/conciliacao/conciliacao.types';
import { IniciarConciliacaoDTO, FiltrarConciliacoesDTO } from '../dtos/conciliacao/conciliacao.dto';
import { TransacaoBancariaRepository } from '../repositories/transacao-bancaria.repository';

@Injectable()
export class ConciliacaoService {
  private readonly logger = new Logger(ConciliacaoService.name);

  constructor(
    private readonly transacaoRepository: TransacaoBancariaRepository,
    private readonly configService: ConfigService,
    @InjectQueue('conciliacao') private conciliacaoQueue: Queue
  ) {}

  async iniciarConciliacaoDiaria(dto: IniciarConciliacaoDTO) {
    try {
      const transacoesPendentes = await this.transacaoRepository.listarPorFiltros({
        status: StatusConciliacao.PENDENTE,
        bancoId: dto.bancoId ? parseInt(dto.bancoId) : undefined,
        dataInicial: dto.dataInicial ? new Date(dto.dataInicial) : undefined,
        dataFinal: dto.dataFinal ? new Date(dto.dataFinal) : undefined
      });

      for (const transacao of transacoesPendentes) {
        await this.conciliacaoQueue.add('processar-transacao', {
          transacaoId: transacao.id
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        });
      }

      this.logger.log(`Enfileiradas ${transacoesPendentes.length} transações para conciliação`);
      
      return {
        mensagem: 'Processo de conciliação iniciado com sucesso',
        quantidadeTransacoes: transacoesPendentes.length
      };
    } catch (error) {
      this.logger.error('Erro ao iniciar conciliação diária', error);
      throw error;
    }
  }

  async consultarStatus(filtros: FiltrarConciliacoesDTO) {
    try {
      const [transacoes, total] = await Promise.all([
        this.transacaoRepository.listarPorFiltros({
          status: filtros.status as StatusConciliacao,
          bancoId: filtros.bancoId ? parseInt(filtros.bancoId) : undefined,
          dataInicial: filtros.dataInicial ? new Date(filtros.dataInicial) : undefined,
          dataFinal: filtros.dataFinal ? new Date(filtros.dataFinal) : undefined
        }),
        this.transacaoRepository.contarPorFiltros({
          status: filtros.status as StatusConciliacao,
          bancoId: filtros.bancoId ? parseInt(filtros.bancoId) : undefined,
          dataInicial: filtros.dataInicial ? new Date(filtros.dataInicial) : undefined,
          dataFinal: filtros.dataFinal ? new Date(filtros.dataFinal) : undefined
        })
      ]);

      return {
        transacoes,
        total,
        filtros
      };
    } catch (error) {
      this.logger.error('Erro ao consultar status das conciliações', error);
      throw error;
    }
  }

  async consultarDivergencias(transacaoId: string) {
    try {
      const transacao = await this.transacaoRepository.buscarPorId(transacaoId);

      if (!transacao) {
        throw new Error(`Transação ${transacaoId} não encontrada`);
      }

      return {
        transacao,
        divergencias: transacao.divergencias || []
      };
    } catch (error) {
      this.logger.error(`Erro ao consultar divergências da transação ${transacaoId}`, error);
      throw error;
    }
  }

  async obterEstatisticas() {
    try {
      return await this.transacaoRepository.obterEstatisticas();
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de conciliação', error);
      throw error;
    }
  }

  async processarTransacao(transacaoId: string): Promise<IResultadoConciliacao> {
    try {
      const transacao = await this.transacaoRepository.buscarPorId(transacaoId);

      if (!transacao) {
        throw new Error(`Transação ${transacaoId} não encontrada`);
      }

      await this.transacaoRepository.atualizarStatus(transacaoId, StatusConciliacao.EM_PROCESSAMENTO);

      const divergencias = await this.verificarDivergencias(transacao);
      const status = divergencias.length === 0 ? StatusConciliacao.CONCILIADO : StatusConciliacao.DIVERGENTE;

      await this.transacaoRepository.atualizarStatus(transacaoId, status, divergencias);

      return {
        transacaoId,
        status,
        divergencias,
        dataConciliacao: new Date()
      };
    } catch (error) {
      this.logger.error(`Erro ao processar transação ${transacaoId}`, error);
      
      await this.transacaoRepository.atualizarStatus(transacaoId, StatusConciliacao.ERRO);

      throw error;
    }
  }

  private async verificarDivergencias(transacao: ITransacaoBancaria): Promise<any[]> {
    const divergencias = [];

    if (!transacao.contrato) {
      divergencias.push({
        campo: 'numeroContrato',
        valorEsperado: transacao.numeroContrato,
        valorEncontrado: null,
        descricao: 'Contrato não encontrado'
      });
      return divergencias;
    }

    // Verifica valor da parcela
    if (transacao.contrato.valorParcela !== transacao.valor) {
      divergencias.push({
        campo: 'valor',
        valorEsperado: transacao.contrato.valorParcela,
        valorEncontrado: transacao.valor,
        descricao: 'Valor da parcela divergente'
      });
    }

    // Verifica data de pagamento
    const dataPagamentoEsperada = await this.calcularDataPagamentoEsperada(transacao.contrato);
    const diffDias = Math.abs(dataPagamentoEsperada.getTime() - transacao.dataPagamento.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDias > 1) { // Tolerância de 1 dia
      divergencias.push({
        campo: 'dataPagamento',
        valorEsperado: dataPagamentoEsperada,
        valorEncontrado: transacao.dataPagamento,
        descricao: 'Data de pagamento fora do prazo esperado'
      });
    }

    return divergencias;
  }

  private async calcularDataPagamentoEsperada(contrato: any): Promise<Date> {
    const dataBase = new Date(contrato.dataInicio);
    const diaPagamento = contrato.diaPagamento || 5;
    
    const dataEsperada = new Date(dataBase.getFullYear(), dataBase.getMonth(), diaPagamento);
    if (dataEsperada < dataBase) {
      dataEsperada.setMonth(dataEsperada.getMonth() + 1);
    }
    
    return dataEsperada;
  }
}
