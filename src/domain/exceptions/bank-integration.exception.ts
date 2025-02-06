import { HttpException, HttpStatus } from '@nestjs/common';

export class BankIntegrationException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        details,
        code: 'BANK_INTEGRATION_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidWebhookSignatureException extends HttpException {
  constructor(bankId: number) {
    super(
      {
        message: 'Assinatura do webhook inválida',
        details: { bankId },
        code: 'INVALID_WEBHOOK_SIGNATURE',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class BankProductNotFoundException extends HttpException {
  constructor(criteria: any) {
    super(
      {
        message: 'Produto não encontrado com os critérios informados',
        details: criteria,
        code: 'BANK_PRODUCT_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
