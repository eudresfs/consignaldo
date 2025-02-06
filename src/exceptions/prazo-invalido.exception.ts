import { HttpException, HttpStatus } from '@nestjs/common';

interface PrazoInvalidoData {
  prazo: number;
  valor: number;
}

export class PrazoInvalidoException extends HttpException {
  constructor(data: PrazoInvalidoData) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Prazo ou valor inválido para o produto',
        error: 'PrazoInvalido',
        data,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
