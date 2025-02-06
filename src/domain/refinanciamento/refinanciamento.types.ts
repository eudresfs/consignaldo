export enum StatusRefinanciamento {
  AGUARDANDO_ANALISE = 'AGUARDANDO_ANALISE',
  EM_ANALISE = 'EM_ANALISE',
  APROVADO = 'APROVADO',
  REPROVADO = 'REPROVADO',
  CANCELADO = 'CANCELADO',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  ERRO = 'ERRO'
}

export enum TipoRecusaRefinanciamento {
  PARCELAS_INSUFICIENTES = 'PARCELAS_INSUFICIENTES',
  MARGEM_INSUFICIENTE = 'MARGEM_INSUFICIENTE',
  CONTRATO_IRREGULAR = 'CONTRATO_IRREGULAR',
  RESTRICAO_CADASTRAL = 'RESTRICAO_CADASTRAL',
  IDADE_NAO_PERMITIDA = 'IDADE_NAO_PERMITIDA',
  DOCUMENTACAO_INCOMPLETA = 'DOCUMENTACAO_INCOMPLETA',
  OUTROS = 'OUTROS'
}

export interface ISimulacaoRefinanciamento {
  contratoId: string;
  valorContrato: number;
  valorParcela: number;
  taxaJuros: number;
  prazoTotal: number;
  parcelasPagas: number;
  saldoDevedor: number;
  economia: {
    valorTotalAtual: number;
    valorTotalNovo: number;
    economiaTotal: number;
    economiaMensal: number;
    reducaoTaxa: number;
  };
}

export interface IRefinanciamentoMetadata {
  historicoTentativas: Array<{
    data: Date;
    status: StatusRefinanciamento;
    observacoes?: string;
  }>;
  validacoes: {
    parcelasPagasSuficientes: boolean;
    margemSuficiente: boolean;
    restricaoCadastral: boolean;
    documentacaoCompleta: boolean;
    idadePermitida: boolean;
  };
  integracao?: {
    protocolo: string;
    dataProcessamento: Date;
  };
}

export interface IFiltrosRefinanciamento {
  status?: StatusRefinanciamento;
  bancoId?: number;
  servidorId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  valorMinimo?: number;
  valorMaximo?: number;
}

export interface IEstatisticasRefinanciamento {
  total: number;
  totalAprovados: number;
  totalReprovados: number;
  totalEmAnalise: number;
  valorTotalRefinanciado: number;
  economiaTotal: number;
  tempoMedioAprovacao: number;
}
