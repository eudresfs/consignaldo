export enum TipoRelatorio {
  CONTRATOS = 'CONTRATOS',
  CONCILIACAO = 'CONCILIACAO',
  MARGEM = 'MARGEM',
  DESCONTOS = 'DESCONTOS',
  PERFORMANCE = 'PERFORMANCE'
}

export enum FormatoRelatorio {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV'
}

export enum StatusRelatorio {
  PENDENTE = 'PENDENTE',
  PROCESSANDO = 'PROCESSANDO',
  CONCLUIDO = 'CONCLUIDO',
  ERRO = 'ERRO'
}

export interface IFiltrosRelatorio {
  dataInicial?: Date;
  dataFinal?: Date;
  consignatariaId?: number;
  consignanteId?: number;
  status?: string;
}

export interface IRelatorioMetadata {
  id: string;
  tipo: TipoRelatorio;
  formato: FormatoRelatorio;
  filtros: IFiltrosRelatorio;
  status: StatusRelatorio;
  dataCriacao: Date;
  dataAtualizacao: Date;
  urlDownload?: string;
  erro?: string;
}

export interface IRelatorioContratos extends IRelatorioMetadata {
  totalContratos?: number;
  valorTotal?: number;
  valorMedioParcela?: number;
}

export interface IRelatorioConciliacao extends IRelatorioMetadata {
  totalTransacoes?: number;
  totalDivergencias?: number;
  valorTotalDivergencias?: number;
}

export interface IRelatorioMargem extends IRelatorioMetadata {
  totalServidores?: number;
  margemMediaDisponivel?: number;
  margemMediaUtilizada?: number;
}

export interface IRelatorioDescontos extends IRelatorioMetadata {
  totalDescontos?: number;
  valorTotalDescontos?: number;
  descontosNaoProcessados?: number;
}

export interface IRelatorioPerformance extends IRelatorioMetadata {
  tempoMedioProcessamento?: number;
  taxaSucesso?: number;
  errosMaisComuns?: Array<{
    tipo: string;
    quantidade: number;
  }>;
}
