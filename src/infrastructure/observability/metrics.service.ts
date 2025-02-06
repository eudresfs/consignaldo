import { Injectable, OnModuleInit } from '@nestjs/common';
import * as prometheus from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private httpRequestDuration: prometheus.Histogram;
  private activeLoans: prometheus.Gauge;
  private loanAmount: prometheus.Histogram;
  private errorCounter: prometheus.Counter;
  private bankIntegrationDuration: prometheus.Histogram;

  onModuleInit() {
    // Métricas HTTP
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // Métricas de Negócio
    this.activeLoans = new prometheus.Gauge({
      name: 'active_loans_total',
      help: 'Total number of active loans',
      labelNames: ['consignataria'],
    });

    this.loanAmount = new prometheus.Histogram({
      name: 'loan_amount_reais',
      help: 'Distribution of loan amounts in reais',
      buckets: [5000, 10000, 15000, 20000, 30000, 50000],
    });

    // Métricas de Erro
    this.errorCounter = new prometheus.Counter({
      name: 'application_errors_total',
      help: 'Total number of application errors',
      labelNames: ['type', 'code'],
    });

    // Métricas de Integração
    this.bankIntegrationDuration = new prometheus.Histogram({
      name: 'bank_integration_duration_seconds',
      help: 'Duration of bank integration operations',
      labelNames: ['bank', 'operation'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    // Registra coletor padrão
    prometheus.collectDefaultMetrics();
  }

  // Métodos para registrar métricas

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }

  recordLoanCreated(consignataria: string, amount: number) {
    this.activeLoans.inc({ consignataria });
    this.loanAmount.observe(amount);
  }

  recordLoanFinished(consignataria: string) {
    this.activeLoans.dec({ consignataria });
  }

  recordError(type: string, code: string) {
    this.errorCounter.inc({ type, code });
  }

  recordBankIntegration(bank: string, operation: string, duration: number) {
    this.bankIntegrationDuration
      .labels(bank, operation)
      .observe(duration);
  }

  // Método para expor métricas
  async getMetrics(): Promise<string> {
    return prometheus.register.metrics();
  }
}
