export enum StatusPortabilidade {
  AGUARDANDO_ANALISE = 'AGUARDANDO_ANALISE',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REPROVADA = 'REPROVADA',
  CANCELADA = 'CANCELADA',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  ERRO = 'ERRO'
}

export enum TipoRecusa {
  MARGEM_INSUFICIENTE = 'MARGEM_INSUFICIENTE',
  PARCELAS_MINIMAS_NAO_PAGAS = 'PARCELAS_MINIMAS_NAO_PAGAS',
  TAXA_NAO_COMPETITIVA = 'TAXA_NAO_COMPETITIVA',
  DOCUMENTACAO_INCOMPLETA = 'DOCUMENTACAO_INCOMPLETA',
  SALDO_DEVEDOR_INCOMPATIVEL = 'SALDO_DEVEDOR_INCOMPATIVEL',
  RESTRICAO_CADASTRAL = 'RESTRICAO_CADASTRAL',
  OUTROS = 'OUTROS'
}

export interface IPortabilidade {
  id: string;
  contratoOrigemId: string;
  bancoOrigemId: number;
  bancoDestinoId: number;
  servidorId: number;
  usuarioId: number;
  valorSaldoDevedor: number;
  valorParcela: number;
  taxaJurosAtual: number;
  taxaJurosNova: number;
  prazoRestante: number;
  prazoTotal: number;
  parcelasPagas: number;
  status: StatusPortabilidade;
  motivoRecusa?: TipoRecusa;
  observacoes?: string;
  documentos?: string[];
  protocoloBanco?: string;
  dataSolicitacao: Date;
  dataAprovacao?: Date;
  dataConclusao?: Date;
  dataAtualizacao: Date;
}

export interface ISimulacaoPortabilidade {
  contratoOrigemId: string;
  valorSaldoDevedor: number;
  valorParcela: number;
  taxaJurosAtual: number;
  prazoRestante: number;
  prazoTotal: number;
  parcelasPagas: number;
  economia: {
    valorTotalAtual: number;
    valorTotalNovo: number;
    economiaTotal: number;
    economiaMensal: number;
    reducaoTaxa: number;
  };
}

export interface IFiltrosPortabilidade {
  status?: StatusPortabilidade;
  bancoOrigemId?: number;
  bancoDestinoId?: number;
  servidorId?: number;
  usuarioId?: number;
  dataInicial?: Date;
  dataFinal?: Date;
}

export interface IPortabilidadeMetadata {
  historicoTentativas?: Array<{
    data: Date;
    status: StatusPortabilidade;
    observacoes?: string;
  }>;
  dadosFinanceiros?: {
    margemConsignavel: number;
    margemDisponivel: number;
    salarioBruto: number;
  };
  validacoes?: {
    parcelasMinimas: boolean;
    margemDisponivel: boolean;
    taxaCompetitiva: boolean;
    documentacaoCompleta: boolean;
    restricaoCadastral: boolean;
  };
}
