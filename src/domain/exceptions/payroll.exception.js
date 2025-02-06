"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollReconciliationException = exports.InvalidPayrollFileException = exports.PayrollImportException = void 0;
const common_1 = require("@nestjs/common");
class PayrollImportException extends common_1.HttpException {
    constructor(message, details) {
        super({
            message,
            details,
            code: 'PAYROLL_IMPORT_ERROR',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.PayrollImportException = PayrollImportException;
class InvalidPayrollFileException extends common_1.HttpException {
    constructor(expectedChecksum, actualChecksum) {
        super({
            message: 'Arquivo de folha inválido ou corrompido',
            details: { expectedChecksum, actualChecksum },
            code: 'INVALID_PAYROLL_FILE',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InvalidPayrollFileException = InvalidPayrollFileException;
class PayrollReconciliationException extends common_1.HttpException {
    constructor(message, details) {
        super({
            message,
            details,
            code: 'PAYROLL_RECONCILIATION_ERROR',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.PayrollReconciliationException = PayrollReconciliationException;
