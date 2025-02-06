import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TipoMetrica } from '../../../domain/monitoramento/monitoramento.types';

/**
 * Classe base para coletores de métricas
 */
@Injectable()
export abstract class MetricaCollector {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Nome do coletor para identificação
   */
  abstract get nome(): string;

  /**
   * Tipo de métrica que este coletor gera
   */
  abstract get tipo(): TipoMetrica;

  /**
   * Intervalo de coleta em segundos
   */
  abstract get intervalo(): number;

  /**
   * Tags padrão para todas as métricas deste coletor
   */
  abstract get tags(): Record<string, string>;

  /**
   * Coleta as métricas
   */
  abstract coletar(): Promise<void>;

  /**
   * Salva uma métrica no banco de dados
   */
  protected async salvarMetrica(
    nome: string,
    descricao: string,
    valor: number | number[],
    tags: Record<string, string> = {},
    extras: Record<string, any> = {}
  ): Promise<void> {
    await this.prisma.metrica.create({
      data: {
        nome,
        descricao,
        tipo: this.tipo,
        tags: { ...this.tags, ...tags },
        valor: Array.isArray(valor) ? null : valor,
        valores: Array.isArray(valor) ? valor : [],
        ...extras
      }
    });
  }

  /**
   * Calcula percentis de uma lista de valores
   */
  protected calcularPercentis(valores: number[], percentis: number[]): Record<number, number> {
    const sorted = [...valores].sort((a, b) => a - b);
    const result: Record<number, number> = {};

    for (const p of percentis) {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      result[p] = sorted[index];
    }

    return result;
  }

  /**
   * Calcula histograma de uma lista de valores
   */
  protected calcularHistograma(
    valores: number[],
    buckets: number[]
  ): { buckets: number[]; contagens: number[] } {
    const contagens = new Array(buckets.length + 1).fill(0);

    for (const valor of valores) {
      let i = 0;
      while (i < buckets.length && valor > buckets[i]) {
        i++;
      }
      contagens[i]++;
    }

    return { buckets, contagens };
  }

  /**
   * Formata bytes para unidades legíveis
   */
  protected formatarBytes(bytes: number): { valor: number; unidade: string } {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let valor = bytes;
    let unidade = units[0];

    for (let i = 0; valor >= 1024 && i < units.length - 1; i++) {
      valor /= 1024;
      unidade = units[i + 1];
    }

    return { valor: Number(valor.toFixed(2)), unidade };
  }

  /**
   * Formata milissegundos para unidades legíveis
   */
  protected formatarDuracao(ms: number): { valor: number; unidade: string } {
    if (ms < 1000) return { valor: ms, unidade: 'ms' };
    if (ms < 60000) return { valor: ms / 1000, unidade: 's' };
    if (ms < 3600000) return { valor: ms / 60000, unidade: 'min' };
    return { valor: ms / 3600000, unidade: 'h' };
  }
}
