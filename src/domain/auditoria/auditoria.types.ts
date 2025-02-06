export enum TipoAuditoria {
  AUTENTICACAO = 'AUTENTICACAO',
  CONTRATO = 'CONTRATO',
  MARGEM = 'MARGEM',
  CONCILIACAO = 'CONCILIACAO',
  RELATORIO = 'RELATORIO',
  CONFIGURACAO = 'CONFIGURACAO'
}

export enum TipoOperacao {
  CRIAR = 'CRIAR',
  ATUALIZAR = 'ATUALIZAR',
  DELETAR = 'DELETAR',
  CONSULTAR = 'CONSULTAR',
  PROCESSAR = 'PROCESSAR'
}

export enum NivelCriticidade {
  BAIXO = 'BAIXO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO'
}

export interface IRegistroAuditoria {
  id: string;
  tipo: TipoAuditoria;
  operacao: TipoOperacao;
  criticidade: NivelCriticidade;
  usuarioId: number;
  entidadeId?: string;
  entidadeTipo?: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
  metadata?: any;
  ip?: string;
  userAgent?: string;
  dataCriacao: Date;
}

export interface IFiltrosAuditoria {
  tipo?: TipoAuditoria;
  operacao?: TipoOperacao;
  criticidade?: NivelCriticidade;
  usuarioId?: number;
  entidadeId?: string;
  entidadeTipo?: string;
  dataInicial?: Date;
  dataFinal?: Date;
}

export interface IAuditoriaMetadata {
  modulo: string;
  funcionalidade: string;
  detalhes?: string;
  origem?: string;
  destino?: string;
  status?: string;
  erro?: string;
}
