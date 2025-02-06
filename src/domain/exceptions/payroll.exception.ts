import { HttpException, HttpStatus } from '@nestjs/common';

export class PayrollImportException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        details,
        code: 'PAYROLL_IMPORT_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidPayrollFileException extends HttpException {
  constructor(expectedChecksum: string, actualChecksum: string) {
    super(
      {
        message: 'Arquivo de folha inválido ou corrompido',
        details: { expectedChecksum, actualChecksum },
        code: 'INVALID_PAYROLL_FILE',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PayrollReconciliationException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        details,
        code: 'PAYROLL_RECONCILIATION_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
