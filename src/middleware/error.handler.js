"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
/**
 * Handler para tratamento centralizado de erros.
 */
class ErrorHandler {
    static handle(error, res) {
        console.error(error);
        const status = error.status || 500;
        return res.status(status).json({
            success: false,
            error: error.message || 'Erro interno no servidor'
        });
    }
}
exports.ErrorHandler = ErrorHandler;
