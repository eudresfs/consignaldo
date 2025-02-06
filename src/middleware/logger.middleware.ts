import morgan from 'morgan';

/**
 * Middleware de logging utilizando Morgan.
 * O modo 'combined' gera logs completos no formato Apache.
 */
export const loggerMiddleware = morgan('combined'); 