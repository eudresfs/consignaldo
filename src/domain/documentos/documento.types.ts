export enum TipoDocumento {
  RG = 'RG',
  CPF = 'CPF',
  COMPROVANTE_RESIDENCIA = 'COMPROVANTE_RESIDENCIA',
  COMPROVANTE_RENDA = 'COMPROVANTE_RENDA',
  CONTRATO = 'CONTRATO',
  TERMO_ADESAO = 'TERMO_ADESAO',
  PROCURACAO = 'PROCURACAO',
  OUTROS = 'OUTROS'
}

export enum StatusDocumento {
  PENDENTE = 'PENDENTE',
  EM_ANALISE = 'EM_ANALISE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  EXPIRADO = 'EXPIRADO'
}

export enum TipoArmazenamento {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  AZURE = 'AZURE'
}

export interface IDocumento {
  id: string;
  tipo: TipoDocumento;
  nome: string;
  descricao?: string;
  mimeType: string;
  tamanho: number;
  hash: string;
  url: string;
  urlTemp?: string;
  status: StatusDocumento;
  tipoArmazenamento: TipoArmazenamento;
  metadata?: IDocumentoMetadata;
  entidadeId?: string;
  entidadeTipo?: string;
  usuarioId: number;
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataExpiracao?: Date;
}

export interface IDocumentoMetadata {
  versao?: string;
  origem?: string;
  validadeInicio?: Date;
  validadeFim?: Date;
  numeroDocumento?: string;
  orgaoEmissor?: string;
  dataEmissao?: Date;
  observacoes?: string;
  tags?: string[];
}

export interface IFiltrosDocumento {
  tipo?: TipoDocumento;
  status?: StatusDocumento;
  usuarioId?: number;
  entidadeId?: string;
  entidadeTipo?: string;
  dataInicial?: Date;
  dataFinal?: Date;
  tags?: string[];
}

export interface IAnalisarDocumentoPayload {
  id: string;
  status: StatusDocumento;
  observacoes?: string;
  usuarioId: number;
}
