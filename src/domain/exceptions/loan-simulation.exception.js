"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValorForaLimiteException = exports.MargemInsuficienteException = exports.LoanSimulationException = void 0;
const common_1 = require("@nestjs/common");
class LoanSimulationException extends common_1.HttpException {
    constructor(message, details) {
        super({
            message,
            details,
            code: 'LOAN_SIMULATION_ERROR',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.LoanSimulationException = LoanSimulationException;
class MargemInsuficienteException extends common_1.HttpException {
    constructor(margem, parcela) {
        super({
            message: 'Valor da parcela excede a margem disponível',
            details: { margem, parcela },
            code: 'MARGEM_INSUFICIENTE',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.MargemInsuficienteException = MargemInsuficienteException;
class ValorForaLimiteException extends common_1.HttpException {
    constructor(valor, min, max) {
        super({
            message: 'Valor solicitado fora dos limites permitidos',
            details: { valor, min, max },
            code: 'VALOR_FORA_LIMITE',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.ValorForaLimiteException = ValorForaLimiteException;
