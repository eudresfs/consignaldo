export class BusinessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class MargemInsuficienteError extends BusinessError {
  constructor(details?: { margem: number; parcela: number }) {
    super(
      'Margem consignável insuficiente',
      'MARGEM_INSUFICIENTE',
      details
    );
  }
}

export class PrazoInvalidoError extends BusinessError {
  constructor(details?: { meses: number; produto: string }) {
    super(
      'Prazo inválido para o tipo de produto',
      'PRAZO_INVALIDO',
      details
    );
  }
}

export class DiaCorteInvalidoError extends BusinessError {
  constructor(details?: { data: Date }) {
    super(
      'Dia de corte inválido',
      'DIA_CORTE_INVALIDO',
      details
    );
  }
}
