import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache/cache.service';
import { LoggerService } from '../logger/logger.service';

export interface RateLimitConfig {
  points: number;      // Número de requisições permitidas
  duration: number;    // Duração em segundos
  blockDuration?: number; // Duração do bloqueio em segundos
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
    private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig>(
      'rateLimit',
      context.getHandler(),
    );

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);

    try {
      const result = await this.checkRateLimit(key, config);
      
      // Adiciona headers com informações do rate limit
      const response = context.switchToHttp().getResponse();
      response.header('X-RateLimit-Limit', config.points);
      response.header('X-RateLimit-Remaining', result.remaining);
      response.header('X-RateLimit-Reset', result.reset);

      return result.allowed;
    } catch (error) {
      this.logger.error(
        'Erro ao verificar rate limit',
        error.stack,
        'RateLimitGuard',
        { key }
      );
      return true; // Em caso de erro, permite a requisição
    }
  }

  private generateKey(request: any): string {
    // Identifica por IP + ConsignanteId (se disponível)
    const ip = request.ip;
    const consignanteId = request.user?.consignanteId;
    
    return this.cache.generateKey('rate-limit', {
      ip,
      consignanteId: consignanteId || 'anonymous',
      path: request.path,
    });
  }

  private async checkRateLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const windowStart = now - (config.duration * 1000);

    // Busca histórico de requisições
    const requests = await this.cache.get<number[]>(key) || [];

    // Remove requisições antigas
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    // Verifica se está bloqueado
    const blockKey = `${key}:blocked`;
    const blocked = await this.cache.get<boolean>(blockKey);

    if (blocked) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Verifica limite
    if (validRequests.length >= config.points) {
      // Se configurado, bloqueia por um período
      if (config.blockDuration) {
        await this.cache.set(blockKey, true, config.blockDuration);
      }

      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Adiciona nova requisição
    validRequests.push(now);
    await this.cache.set(key, validRequests, config.duration);

    return {
      allowed: true,
      remaining: config.points - validRequests.length,
      reset: Math.floor(now / 1000) + config.duration,
    };
  }
}
