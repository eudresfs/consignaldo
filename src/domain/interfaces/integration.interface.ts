import { IntegrationType } from '../enums/integration-type.enum';

export interface IntegrationConfig {
  id: number;
  nome: string;
  tipo: IntegrationType;
  url: string;
  token?: string;
  certificado?: string;
  headers?: Record<string, string>;
  ativo: boolean;
  consignanteId: number;
  timeoutMs: number;
  retries: number;
}

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  duration: number;
}

export interface FolhaPagamentoData {
  competencia: string;
  matricula: string;
  nome: string;
  cpf: string;
  salarioBruto: number;
  descontos: number;
  salarioLiquido: number;
  margem?: number;
}

export interface MargemData {
  matricula: string;
  margemDisponivel: number;
  margemUtilizada: number;
  margemTotal: number;
  contratos: {
    id: string;
    parcela: number;
    prazoRestante: number;
    saldoDevedor: number;
  }[];
}

export interface AverbacaoData {
  matricula: string;
  contrato: string;
  parcela: number;
  prazo: number;
  dataInicio: Date;
  banco: string;
  situacao: string;
}
