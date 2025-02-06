import { HttpException, HttpStatus } from '@nestjs/common';

interface MargemInsuficienteData {
  margem: number;
  parcela: number;
  matricula: string;
}

export class MargemInsuficienteException extends HttpException {
  constructor(data: MargemInsuficienteData) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Margem consignável insuficiente',
        error: 'MargemInsuficiente',
        data,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
