"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaCorteInvalidoError = exports.PrazoInvalidoError = exports.MargemInsuficienteError = exports.BusinessError = void 0;
class BusinessError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'BusinessError';
    }
}
exports.BusinessError = BusinessError;
class MargemInsuficienteError extends BusinessError {
    constructor(details) {
        super('Margem consignável insuficiente', 'MARGEM_INSUFICIENTE', details);
    }
}
exports.MargemInsuficienteError = MargemInsuficienteError;
class PrazoInvalidoError extends BusinessError {
    constructor(details) {
        super('Prazo inválido para o tipo de produto', 'PRAZO_INVALIDO', details);
    }
}
exports.PrazoInvalidoError = PrazoInvalidoError;
class DiaCorteInvalidoError extends BusinessError {
    constructor(details) {
        super('Dia de corte inválido', 'DIA_CORTE_INVALIDO', details);
    }
}
exports.DiaCorteInvalidoError = DiaCorteInvalidoError;
