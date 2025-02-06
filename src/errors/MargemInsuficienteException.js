"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MargemInsuficienteException = void 0;
class MargemInsuficienteException extends Error {
    constructor(details) {
        super('Margem insuficiente');
        this.details = details;
    }
}
exports.MargemInsuficienteException = MargemInsuficienteException;
