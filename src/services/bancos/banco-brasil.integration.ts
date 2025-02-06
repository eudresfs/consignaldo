import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BancoIntegrationBase } from './banco-integration.base';
import { 
  ISimulacaoBancoResponse,
  ISolicitacaoPortabilidadeResponse,
  IConsultaPortabilidadeResponse 
} from './banco-integration.interface';
import { StatusPortabilidade } from '../../domain/portabilidade/portabilidade.types';

@Injectable()
export class BancoBrasilIntegration extends BancoIntegrationBase {
  private static readonly BANCO_ID = 1; // ID do Banco do Brasil

  constructor(
    private readonly loggerService: Logger,
    private readonly configService: ConfigService
  ) {
    super(loggerService, configService, BancoBrasilIntegration.BANCO_ID);
  }

  async simularPortabilidade(
    contratoId: string,
    valorSaldoDevedor: number,
    prazo: number
  ): Promise<ISimulacaoBancoResponse> {
    const response = await this.handleRequest<any>('POST', '/portabilidade/simulacao', {
      contratoOrigem: contratoId,
      valorSaldoDevedor,
      prazoDesejado: prazo,
      codigoInstituicaoOrigem: this.bancoId,
      dataSimulacao: new Date().toISOString()
    });

    return {
      protocolo: response.protocoloSimulacao,
      taxaJuros: response.taxaJurosAnual,
      valorParcela: response.valorParcela,
      prazo: response.prazoTotal,
      valorFinanciado: response.valorFinanciado,
      custoEfetivo: response.custoEfetivoTotal,
      dataValidade: new Date(response.dataValidadeSimulacao)
    };
  }

  async solicitarPortabilidade(
    contratoId: string,
    simulacaoProtocolo: string,
    documentos: string[]
  ): Promise<ISolicitacaoPortabilidadeResponse> {
    // Primeiro faz upload dos documentos
    const docsUpload = await Promise.all(
      documentos.map(doc => this.uploadDocumento(doc))
    );

    // Envia a solicitação
    const response = await this.handleRequest<any>('POST', '/portabilidade/solicitar', {
      protocoloSimulacao: simulacaoProtocolo,
      contratoOrigem: contratoId,
      documentos: docsUpload.map(d => ({
        tipo: d.tipo,
        hash: d.hash,
        url: d.url
      })),
      dataSolicitacao: new Date().toISOString()
    });

    return {
      protocolo: response.protocoloPortabilidade,
      status: this.mapearStatus(response.statusSolicitacao),
      observacoes: response.observacoes,
      dataProcessamento: new Date(response.dataProcessamento)
    };
  }

  async consultarPortabilidade(
    protocolo: string
  ): Promise<IConsultaPortabilidadeResponse> {
    const response = await this.handleRequest<any>('GET', `/portabilidade/${protocolo}`);

    return {
      protocolo: response.protocoloPortabilidade,
      status: this.mapearStatus(response.status),
      motivoRecusa: response.motivoRecusa,
      observacoes: response.observacoes,
      dataAtualizacao: new Date(response.dataAtualizacao),
      documentosAdicionais: response.documentosAdicionais
    };
  }

  async cancelarPortabilidade(protocolo: string): Promise<boolean> {
    try {
      await this.handleRequest<any>('POST', `/portabilidade/${protocolo}/cancelar`, {
        motivoCancelamento: 'SOLICITACAO_CLIENTE',
        dataCancelamento: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao cancelar portabilidade ${protocolo} no Banco do Brasil`,
        error
      );
      return false;
    }
  }

  private async uploadDocumento(documento: string): Promise<{
    tipo: string;
    hash: string;
    url: string;
  }> {
    const formData = new FormData();
    formData.append('arquivo', documento);

    const response = await this.handleRequest<any>(
      'POST',
      '/portabilidade/documentos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return {
      tipo: response.tipoDocumento,
      hash: response.hashArquivo,
      url: response.urlDocumento
    };
  }

  private mapearStatus(statusBanco: string): StatusPortabilidade {
    const mapeamento = {
      'AGUARDANDO_PROCESSAMENTO': StatusPortabilidade.AGUARDANDO_ANALISE,
      'EM_ANALISE': StatusPortabilidade.EM_ANALISE,
      'APROVADA': StatusPortabilidade.APROVADA,
      'REPROVADA': StatusPortabilidade.REPROVADA,
      'CANCELADA': StatusPortabilidade.CANCELADA,
      'EM_PROCESSAMENTO': StatusPortabilidade.EM_PROCESSAMENTO,
      'CONCLUIDA': StatusPortabilidade.CONCLUIDA,
      'ERRO_PROCESSAMENTO': StatusPortabilidade.ERRO
    };

    return mapeamento[statusBanco] || StatusPortabilidade.ERRO;
  }
}
