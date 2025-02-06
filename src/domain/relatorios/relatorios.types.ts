export enum TipoRelatorio {
  CONTRATOS = 'CONTRATOS',
  MARGEM = 'MARGEM',
  CONSIGNACOES = 'CONSIGNACOES',
  PERFORMANCE = 'PERFORMANCE'
}

export enum FormatoRelatorio {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV'
}

export enum StatusRelatorio {
  AGUARDANDO = 'AGUARDANDO',
  PROCESSANDO = 'PROCESSANDO',
  CONCLUIDO = 'CONCLUIDO',
  ERRO = 'ERRO'
}

export interface Template {
  id: string;
  nome: string;
  tipo: TipoRelatorio;
  formato: FormatoRelatorio;
  layout: string;
  cabecalho?: string;
  rodape?: string;
  estilos?: string;
  metadata?: Record<string, any>;
}

export interface Relatorio {
  id: string;
  templateId: string;
  tipo: TipoRelatorio;
  formato: FormatoRelatorio;
  status: StatusRelatorio;
  filtros?: Record<string, any>;
  arquivoUrl?: string;
  erros?: string[];
  metadata?: Record<string, any>;
  criadoEm: Date;
  atualizadoEm: Date;
  usuarioId: number;
}

export interface RelatorioContrato {
  id: string;
  numero: string;
  servidor: string;
  banco: string;
  valor: number;
  parcelas: number;
  status: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface RelatorioMargem {
  id: string;
  servidor: string;
  orgao: string;
  margemTotal: number;
  margemUsada: number;
  margemDisponivel: number;
  quantidadeContratos: number;
  dataAtualizacao: Date;
}

export interface RelatorioConsignacao {
  id: string;
  contrato: string;
  servidor: string;
  parcela: number;
  valor: number;
  competencia: string;
  status: string;
  dataProcessamento: Date;
}

export interface RelatorioPerformance {
  periodo: string;
  requisicoes: number;
  tempoMedioResposta: number;
  erros: number;
  taxaSucesso: number;
  endpoints: {
    endpoint: string;
    requisicoes: number;
    tempoMedio: number;
    erros: number;
  }[];
}
