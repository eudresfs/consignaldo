import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const esTransport = new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
        auth: {
          username: process.env.ELASTICSEARCH_USER,
          password: process.env.ELASTICSEARCH_PASS,
        },
      },
      indexPrefix: 'consignaldo-logs',
    });

    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'consignaldo' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
        esTransport,
      ],
    });
  }

  private maskSensitiveData(message: any): any {
    if (typeof message === 'string') {
      // Mascara CPF
      message = message.replace(
        /\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}/g,
        '***.***.***-**'
      );
      // Mascara cartão de crédito
      message = message.replace(
        /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
        '****-****-****-****'
      );
    } else if (typeof message === 'object') {
      Object.keys(message).forEach(key => {
        if (key.toLowerCase().includes('cpf') || 
            key.toLowerCase().includes('cartao') ||
            key.toLowerCase().includes('senha')) {
          message[key] = '********';
        } else {
          message[key] = this.maskSensitiveData(message[key]);
        }
      });
    }
    return message;
  }

  log(message: any, context?: string) {
    this.logger.info(this.maskSensitiveData(message), { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(this.maskSensitiveData(message), { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(this.maskSensitiveData(message), { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(this.maskSensitiveData(message), { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(this.maskSensitiveData(message), { context });
  }
}
