/**
 * Tipos e interfaces para a API Pública do Consignaldo
 * @module ApiPublica
 */

export enum TipoIntegracao {
  WEBHOOK = 'WEBHOOK',
  REST = 'REST',
  SOAP = 'SOAP',
  SFTP = 'SFTP'
}

export enum StatusIntegracao {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  SUSPENSO = 'SUSPENSO'
}

export interface ApiKey {
  id: string;
  chave: string;
  nome: string;
  clienteId: string;
  permissoes: string[];
  limitesUso: LimitesUso;
  status: StatusIntegracao;
  metadata: Record<string, any>;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface LimitesUso {
  requisicoesPorMinuto: number;
  requisicoesPorHora: number;
  requisicoesPorDia: number;
  requisicoesConcorrentes: number;
}

export interface WebhookConfig {
  url: string;
  eventos: string[];
  headers?: Record<string, string>;
  ativo: boolean;
  tentativasMaximas: number;
  intervalosRetentativa: number[];
}

export interface LogIntegracao {
  id: string;
  apiKeyId: string;
  endpoint: string;
  metodo: string;
  statusCode: number;
  tempoResposta: number;
  dataHora: Date;
  ip: string;
  userAgent: string;
  payload?: Record<string, any>;
  response?: Record<string, any>;
}

export interface MetricasUso {
  apiKeyId: string;
  periodo: string;
  requisicoes: number;
  erros: number;
  tempoMedioResposta: number;
  statusCodes: Record<number, number>;
}

export interface FiltrosLog {
  apiKeyId?: string;
  endpoint?: string;
  statusCode?: number;
  dataInicio?: Date;
  dataFim?: Date;
  ip?: string;
}

export interface Paginacao {
  pagina: number;
  itensPorPagina: number;
  total: number;
}

export interface RespostaApiPublica<T> {
  sucesso: boolean;
  dados: T;
  erro?: {
    codigo: string;
    mensagem: string;
    detalhes?: Record<string, any>;
  };
  paginacao?: Paginacao;
}
