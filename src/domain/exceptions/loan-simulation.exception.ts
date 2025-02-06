import { HttpException, HttpStatus } from '@nestjs/common';

export class LoanSimulationException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        details,
        code: 'LOAN_SIMULATION_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MargemInsuficienteException extends HttpException {
  constructor(margem: number, parcela: number) {
    super(
      {
        message: 'Valor da parcela excede a margem disponível',
        details: { margem, parcela },
        code: 'MARGEM_INSUFICIENTE',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ValorForaLimiteException extends HttpException {
  constructor(valor: number, min: number, max: number) {
    super(
      {
        message: 'Valor solicitado fora dos limites permitidos',
        details: { valor, min, max },
        code: 'VALOR_FORA_LIMITE',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
