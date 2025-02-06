import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { CacheService } from '../infrastructure/cache/cache.service';
import { 
  IntegrationConfig, 
  IntegrationResult,
  FolhaPagamentoData,
  MargemData,
  AverbacaoData 
} from '../domain/interfaces/integration.interface';
import { IntegrationType } from '../domain/enums/integration-type.enum';
import { firstValueFrom } from 'rxjs';
import { readFileSync } from 'fs';
import { Agent } from 'https';
import { IntegrationError } from '../domain/errors/integration.error';

@Injectable()
export class IntegrationService {
  private readonly CACHE_TTL = 300; // 5 minutos
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {}

  async importarFolhaPagamento(
    consignanteId: number,
    competencia: string,
    arquivo: Buffer
  ): Promise<IntegrationResult<FolhaPagamentoData[]>> {
    const config = await this.getIntegrationConfig(consignanteId, IntegrationType.FOLHA_PAGAMENTO);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('file', new Blob([arquivo]), 'folha.txt');
      formData.append('competencia', competencia);

      const response = await this.executeRequest(config, {
        method: 'POST',
        data: formData,
      });

      return {
        success: true,
        data: response.data,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(
        'Erro ao importar folha de pagamento',
        error.stack,
        'IntegrationService',
        { consignanteId, competencia }
      );

      return {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: 'Erro ao importar folha de pagamento',
          details: error.message,
        },
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  async consultarMargem(
    consignanteId: number,
    matricula: string
  ): Promise<IntegrationResult<MargemData>> {
    const cacheKey = this.cache.generateKey('margem', { consignanteId, matricula });
    const cached = await this.cache.get<IntegrationResult<MargemData>>(cacheKey);

    if (cached) {
      return cached;
    }

    const config = await this.getIntegrationConfig(consignanteId, IntegrationType.MARGEM);
    const startTime = Date.now();

    try {
      const response = await this.executeRequest(config, {
        method: 'GET',
        url: `${config.url}/margem/${matricula}`,
      });

      const result = {
        success: true,
        data: response.data,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };

      await this.cache.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: {
          code: 'MARGEM_ERROR',
          message: 'Erro ao consultar margem',
          details: error.message,
        },
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };

      // Cache erro por menos tempo
      await this.cache.set(cacheKey, errorResult, 60);
      return errorResult;
    }
  }

  async averbarContrato(
    consignanteId: number,
    dados: AverbacaoData
  ): Promise<IntegrationResult<AverbacaoData>> {
    const config = await this.getIntegrationConfig(consignanteId, IntegrationType.AVERBACAO);
    const startTime = Date.now();

    try {
      const response = await this.executeRequest(config, {
        method: 'POST',
        url: `${config.url}/averbar`,
        data: dados,
      });

      return {
        success: true,
        data: response.data,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      throw new IntegrationError('Erro ao averbar contrato', {
        consignanteId,
        contrato: dados.contrato,
        error: error.message,
      });
    }
  }

  private async getIntegrationConfig(
    consignanteId: number,
    tipo: IntegrationType
  ): Promise<IntegrationConfig> {
    const config = await this.prisma.integrationConfig.findFirst({
      where: {
        consignanteId,
        tipo,
        ativo: true,
      },
    });

    if (!config) {
      throw new IntegrationError('Configuração de integração não encontrada', {
        consignanteId,
        tipo,
      });
    }

    return config;
  }

  private async executeRequest(
    config: IntegrationConfig,
    options: any,
    retryCount = 0
  ): Promise<any> {
    try {
      const httpsAgent = config.certificado
        ? new Agent({
            cert: readFileSync(config.certificado),
            rejectUnauthorized: this.config.get('NODE_ENV') === 'production',
          })
        : undefined;

      const response = await firstValueFrom(
        this.http.request({
          ...options,
          httpsAgent,
          headers: {
            ...options.headers,
            ...config.headers,
            Authorization: config.token ? `Bearer ${config.token}` : undefined,
          },
          timeout: config.timeoutMs,
        })
      );

      return response;
    } catch (error) {
      if (retryCount < (config.retries || this.MAX_RETRIES)) {
        this.logger.warn(
          `Tentativa ${retryCount + 1} falhou, tentando novamente...`,
          'IntegrationService',
          { config: config.id, error: error.message }
        );

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );

        return this.executeRequest(config, options, retryCount + 1);
      }

      throw error;
    }
  }
}
