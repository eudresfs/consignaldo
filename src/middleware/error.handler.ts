import { Response } from 'express';

/**
 * Handler para tratamento centralizado de erros.
 */
export class ErrorHandler {
  static handle(error: any, res: Response) {
    console.error(error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Erro interno no servidor'
    });
  }
} 