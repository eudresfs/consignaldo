export enum StatusConciliacao {
  PENDENTE = 'PENDENTE',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCILIADO = 'CONCILIADO',
  DIVERGENTE = 'DIVERGENTE',
  ERRO = 'ERRO'
}

export interface ITransacaoBancaria {
  id: string;
  dataPagamento: Date;
  valor: number;
  numeroContrato: string;
  bancoId: string;
  identificadorTransacao: string;
  status: StatusConciliacao;
}

export interface IResultadoConciliacao {
  transacaoId: string;
  status: StatusConciliacao;
  divergencias?: {
    campo: string;
    valorEsperado: any;
    valorEncontrado: any;
  }[];
  dataConciliacao: Date;
}
