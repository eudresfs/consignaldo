"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankProductNotFoundException = exports.InvalidWebhookSignatureException = exports.BankIntegrationException = void 0;
const common_1 = require("@nestjs/common");
class BankIntegrationException extends common_1.HttpException {
    constructor(message, details) {
        super({
            message,
            details,
            code: 'BANK_INTEGRATION_ERROR',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.BankIntegrationException = BankIntegrationException;
class InvalidWebhookSignatureException extends common_1.HttpException {
    constructor(bankId) {
        super({
            message: 'Assinatura do webhook inválida',
            details: { bankId },
            code: 'INVALID_WEBHOOK_SIGNATURE',
        }, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.InvalidWebhookSignatureException = InvalidWebhookSignatureException;
class BankProductNotFoundException extends common_1.HttpException {
    constructor(criteria) {
        super({
            message: 'Produto não encontrado com os critérios informados',
            details: criteria,
            code: 'BANK_PRODUCT_NOT_FOUND',
        }, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.BankProductNotFoundException = BankProductNotFoundException;
