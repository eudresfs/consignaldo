import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: 'error.log', 
      level: 'error',
      format: format.json()
    }),
    new transports.File({ 
      filename: 'combined.log',
      format: format.json()
    })
  ]
}); 