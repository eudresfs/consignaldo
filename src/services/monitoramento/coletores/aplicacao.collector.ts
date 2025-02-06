import { Injectable } from '@nestjs/common';
import { MetricaCollector } from './base.collector';
import { TipoMetrica } from '../../../domain/monitoramento/monitoramento.types';
import { CacheService } from '../../cache.service';

/**
 * Coletor de métricas da aplicação
 * Monitora requisições, cache, banco de dados e serviços externos
 */
@Injectable()
export class AplicacaoCollector extends MetricaCollector {
  nome = 'aplicacao';
  tipo = TipoMetrica.HISTOGRAMA;
  intervalo = 30; // 30 segundos
  tags = { categoria: 'aplicacao' };

  // Métricas em memória
  private requestDuracoes: number[] = [];
  private requestErros: number = 0;
  private requestTotal: number = 0;
  private dbQueries: number = 0;
  private dbErros: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(
    prisma: PrismaService,
    private readonly cache: CacheService
  ) {
    super(prisma);
  }

  async coletar(): Promise<void> {
    await Promise.all([
      this.coletarRequests(),
      this.coletarDatabase(),
      this.coletarCache()
    ]);

    // Limpar métricas em memória
    this.limparMetricas();
  }

  /**
   * Registra duração de uma requisição
   */
  registrarRequest(duracao: number, erro?: boolean): void {
    this.requestDuracoes.push(duracao);
    this.requestTotal++;
    if (erro) this.requestErros++;
  }

  /**
   * Registra operação de banco de dados
   */
  registrarDatabase(erro?: boolean): void {
    this.dbQueries++;
    if (erro) this.dbErros++;
  }

  /**
   * Registra operação de cache
   */
  registrarCache(hit: boolean): void {
    if (hit) this.cacheHits++;
    else this.cacheMisses++;
  }

  private async coletarRequests(): Promise<void> {
    if (this.requestDuracoes.length === 0) return;

    // Histograma de durações
    const buckets = [10, 50, 100, 200, 500, 1000, 2000, 5000]; // ms
    const { buckets: histBuckets, contagens } = this.calcularHistograma(
      this.requestDuracoes,
      buckets
    );

    await this.salvarMetrica(
      'aplicacao_request_duracao',
      'Distribuição da duração das requisições',
      this.requestDuracoes,
      { tipo: 'request' },
      {
        buckets: histBuckets,
        contagens,
        unidade: 'ms'
      }
    );

    // Percentis
    const percentis = this.calcularPercentis(
      this.requestDuracoes,
      [50, 75, 90, 95, 99]
    );

    await this.salvarMetrica(
      'aplicacao_request_duracao_percentis',
      'Percentis da duração das requisições',
      this.requestDuracoes,
      { tipo: 'request' },
      {
        percentis,
        unidade: 'ms'
      }
    );

    // Taxa de erro
    const taxaErro = (this.requestErros / this.requestTotal) * 100;
    await this.salvarMetrica(
      'aplicacao_request_erros',
      'Taxa de erro das requisições',
      taxaErro,
      { tipo: 'request' },
      { unidade: '%' }
    );

    // Requisições por segundo
    const rps = this.requestTotal / this.intervalo;
    await this.salvarMetrica(
      'aplicacao_request_rps',
      'Requisições por segundo',
      rps,
      { tipo: 'request' },
      { unidade: 'req/s' }
    );
  }

  private async coletarDatabase(): Promise<void> {
    // Queries por segundo
    const qps = this.dbQueries / this.intervalo;
    await this.salvarMetrica(
      'aplicacao_db_qps',
      'Queries por segundo',
      qps,
      { tipo: 'database' },
      { unidade: 'queries/s' }
    );

    // Taxa de erro
    if (this.dbQueries > 0) {
      const taxaErro = (this.dbErros / this.dbQueries) * 100;
      await this.salvarMetrica(
        'aplicacao_db_erros',
        'Taxa de erro das queries',
        taxaErro,
        { tipo: 'database' },
        { unidade: '%' }
      );
    }

    // Conexões ativas
    const stats = await this.prisma.$metrics.json();
    await this.salvarMetrica(
      'aplicacao_db_conexoes',
      'Conexões ativas com o banco',
      stats.activeConnections ?? 0,
      { tipo: 'database' }
    );
  }

  private async coletarCache(): Promise<void> {
    // Taxa de hit
    const total = this.cacheHits + this.cacheMisses;
    if (total > 0) {
      const hitRate = (this.cacheHits / total) * 100;
      await this.salvarMetrica(
        'aplicacao_cache_hit_rate',
        'Taxa de acerto do cache',
        hitRate,
        { tipo: 'cache' },
        { unidade: '%' }
      );
    }

    // Tamanho do cache
    const stats = await this.cache.getStats();
    const { valor, unidade } = this.formatarBytes(stats.size);
    await this.salvarMetrica(
      'aplicacao_cache_tamanho',
      'Tamanho total do cache',
      valor,
      { tipo: 'cache' },
      { unidade }
    );

    // Chaves no cache
    await this.salvarMetrica(
      'aplicacao_cache_chaves',
      'Número de chaves no cache',
      stats.keys,
      { tipo: 'cache' }
    );
  }

  private limparMetricas(): void {
    this.requestDuracoes = [];
    this.requestErros = 0;
    this.requestTotal = 0;
    this.dbQueries = 0;
    this.dbErros = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
