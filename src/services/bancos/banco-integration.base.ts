import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { IBancoIntegration } from './banco-integration.interface';

export abstract class BancoIntegrationBase implements IBancoIntegration {
  protected readonly logger: Logger;
  protected readonly httpClient: AxiosInstance;
  protected readonly config: ConfigService;
  protected readonly baseUrl: string;
  protected readonly apiKey: string;
  protected readonly bancoId: number;

  constructor(
    logger: Logger,
    config: ConfigService,
    bancoId: number
  ) {
    this.logger = logger;
    this.config = config;
    this.bancoId = bancoId;

    // Configurar baseUrl e apiKey baseado no banco
    this.baseUrl = this.config.get<string>(`BANCO_${bancoId}_URL`);
    this.apiKey = this.config.get<string>(`BANCO_${bancoId}_API_KEY`);

    // Configurar cliente HTTP com retry e timeout
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 segundos
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Adicionar interceptors para logging e retry
    this.setupInterceptors();
  }

  protected setupInterceptors() {
    // Interceptor de Request para logging
    this.httpClient.interceptors.request.use((config) => {
      this.logger.debug(
        `[Banco ${this.bancoId}] Request: ${config.method.toUpperCase()} ${config.url}`,
        { headers: config.headers, data: config.data }
      );
      return config;
    });

    // Interceptor de Response para logging e retry
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `[Banco ${this.bancoId}] Response: ${response.status}`,
          { data: response.data }
        );
        return response;
      },
      async (error) => {
        this.logger.error(
          `[Banco ${this.bancoId}] Error: ${error.message}`,
          { error: error.response?.data }
        );

        // Implementar retry baseado no tipo de erro
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        throw error;
      }
    );
  }

  protected shouldRetry(error: any): boolean {
    // Implementar lógica de retry baseada no erro
    const retryableStatus = [408, 429, 500, 502, 503, 504];
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];
    
    return (
      (error.response && retryableStatus.includes(error.response.status)) ||
      (error.code && retryableErrors.includes(error.code))
    );
  }

  protected async retryRequest(error: any): Promise<any> {
    const config = error.config;
    config.retryCount = config.retryCount || 0;
    const maxRetries = 3;

    if (config.retryCount >= maxRetries) {
      throw error;
    }

    config.retryCount += 1;
    const delay = Math.pow(2, config.retryCount) * 1000; // Exponential backoff

    this.logger.debug(
      `[Banco ${this.bancoId}] Retrying request (${config.retryCount}/${maxRetries}) after ${delay}ms`
    );

    await new Promise(resolve => setTimeout(resolve, delay));
    return this.httpClient(config);
  }

  protected async handleRequest<T>(
    method: string,
    url: string,
    data?: any,
    params?: any
  ): Promise<T> {
    try {
      const response = await this.httpClient.request({
        method,
        url,
        data,
        params
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `[Banco ${this.bancoId}] Error in ${method} ${url}`,
        { error: error.message, data, params }
      );
      throw error;
    }
  }

  // Métodos abstratos que devem ser implementados por cada banco
  abstract simularPortabilidade(
    contratoId: string,
    valorSaldoDevedor: number,
    prazo: number
  ): Promise<any>;

  abstract solicitarPortabilidade(
    contratoId: string,
    simulacaoProtocolo: string,
    documentos: string[]
  ): Promise<any>;

  abstract consultarPortabilidade(protocolo: string): Promise<any>;

  abstract cancelarPortabilidade(protocolo: string): Promise<boolean>;
}
