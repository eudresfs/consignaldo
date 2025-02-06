import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  private readonly client;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.client = createClient({
      url: this.config.get('REDIS_URL'),
    });

    this.client.on('error', (error) => {
      this.logger.error(
        'Erro na conexão com Redis',
        error.stack,
        'CacheService'
      );
    });

    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error(
        'Falha ao conectar com Redis',
        error.stack,
        'CacheService'
      );
    }
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(':');

    return `${prefix}:${sortedParams}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(
        'Erro ao ler do cache',
        error.stack,
        'CacheService',
        { key }
      );
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch (error) {
      this.logger.error(
        'Erro ao gravar no cache',
        error.stack,
        'CacheService',
        { key }
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(
        'Erro ao deletar do cache',
        error.stack,
        'CacheService',
        { key }
      );
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      this.logger.error(
        'Erro ao limpar cache',
        error.stack,
        'CacheService'
      );
    }
  }
}
