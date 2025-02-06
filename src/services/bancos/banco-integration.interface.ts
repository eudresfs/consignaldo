import { StatusPortabilidade } from '../../domain/portabilidade/portabilidade.types';

export interface ISimulacaoBancoResponse {
  protocolo: string;
  taxaJuros: number;
  valorParcela: number;
  prazo: number;
  valorFinanciado: number;
  custoEfetivo: number;
  dataValidade: Date;
}

export interface ISolicitacaoPortabilidadeResponse {
  protocolo: string;
  status: StatusPortabilidade;
  observacoes?: string;
  dataProcessamento: Date;
}

export interface IConsultaPortabilidadeResponse {
  protocolo: string;
  status: StatusPortabilidade;
  motivoRecusa?: string;
  observacoes?: string;
  dataAtualizacao: Date;
  documentosAdicionais?: string[];
}

export interface IBancoIntegration {
  /**
   * Simula uma portabilidade no banco
   * @param contratoId ID do contrato original
   * @param valorSaldoDevedor Valor do saldo devedor
   * @param prazo Prazo desejado
   * @returns Dados da simulação
   */
  simularPortabilidade(
    contratoId: string,
    valorSaldoDevedor: number,
    prazo: number
  ): Promise<ISimulacaoBancoResponse>;

  /**
   * Solicita uma portabilidade no banco
   * @param contratoId ID do contrato original
   * @param simulacaoProtocolo Protocolo da simulação
   * @param documentos Lista de documentos necessários
   * @returns Dados da solicitação
   */
  solicitarPortabilidade(
    contratoId: string,
    simulacaoProtocolo: string,
    documentos: string[]
  ): Promise<ISolicitacaoPortabilidadeResponse>;

  /**
   * Consulta o status de uma portabilidade
   * @param protocolo Protocolo da portabilidade
   * @returns Status atual da portabilidade
   */
  consultarPortabilidade(
    protocolo: string
  ): Promise<IConsultaPortabilidadeResponse>;

  /**
   * Cancela uma solicitação de portabilidade
   * @param protocolo Protocolo da portabilidade
   * @returns true se cancelado com sucesso
   */
  cancelarPortabilidade(protocolo: string): Promise<boolean>;
}
