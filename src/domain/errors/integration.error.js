"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationError = void 0;
class IntegrationError extends Error {
    constructor(message, context) {
        super(message);
        this.context = context;
        this.name = 'IntegrationError';
    }
}
exports.IntegrationError = IntegrationError;
