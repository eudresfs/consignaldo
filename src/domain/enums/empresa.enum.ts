export enum EmpresaTipo {
  CASE_PARTNERS = 1,
  CONSIGNANTE = 2,
  AGENTE = 3,
  BANCO = 4,
  FINANCEIRA = 5,
  SINDICATO = 6,
  ASSOCIACAO = 7,
  CONVENIO = 8,
}

export enum EmpresaSituacao {
  NORMAL = 1,
  SUSPENSO_AVERBACOES = 2,
  SUSPENSO_COMPRA = 3,
  BLOQUEADO = 4,
  BLOQUEIO_PERSONALIZADO = 5
}

export enum ConsignanteTipo {
  ESTADO = 'ESTADO',
  CIDADE = 'CIDADE',
  AUTARQUIA = 'AUTARQUIA'
}
