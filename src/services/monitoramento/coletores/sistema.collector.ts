import { Injectable } from '@nestjs/common';
import { MetricaCollector } from './base.collector';
import { TipoMetrica } from '../../../domain/monitoramento/monitoramento.types';
import * as os from 'os';
import * as process from 'process';

/**
 * Coletor de métricas do sistema
 * Monitora CPU, memória, disco e processo
 */
@Injectable()
export class SistemaCollector extends MetricaCollector {
  nome = 'sistema';
  tipo = TipoMetrica.MEDIDOR;
  intervalo = 60; // 1 minuto
  tags = { categoria: 'sistema' };

  async coletar(): Promise<void> {
    await Promise.all([
      this.coletarCPU(),
      this.coletarMemoria(),
      this.coletarDisco(),
      this.coletarProcesso()
    ]);
  }

  private async coletarCPU(): Promise<void> {
    const cpus = os.cpus();
    const totalUser = cpus.reduce((acc, cpu) => acc + cpu.times.user, 0);
    const totalSys = cpus.reduce((acc, cpu) => acc + cpu.times.sys, 0);
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const total = totalUser + totalSys + totalIdle;

    const usoCPU = ((totalUser + totalSys) / total) * 100;

    await this.salvarMetrica(
      'sistema_cpu_uso',
      'Percentual de uso da CPU',
      usoCPU,
      { tipo: 'cpu' },
      { unidade: '%' }
    );

    // Carga média
    const loadAvg = os.loadavg();
    await this.salvarMetrica(
      'sistema_cpu_carga',
      'Carga média da CPU (1m, 5m, 15m)',
      loadAvg[0],
      { tipo: 'cpu', periodo: '1m' }
    );
    await this.salvarMetrica(
      'sistema_cpu_carga',
      'Carga média da CPU (1m, 5m, 15m)',
      loadAvg[1],
      { tipo: 'cpu', periodo: '5m' }
    );
    await this.salvarMetrica(
      'sistema_cpu_carga',
      'Carga média da CPU (1m, 5m, 15m)',
      loadAvg[2],
      { tipo: 'cpu', periodo: '15m' }
    );
  }

  private async coletarMemoria(): Promise<void> {
    const total = os.totalmem();
    const livre = os.freemem();
    const usado = total - livre;
    const percentual = (usado / total) * 100;

    const { valor: valorTotal, unidade: unidadeTotal } = this.formatarBytes(total);
    const { valor: valorUsado, unidade: unidadeUsado } = this.formatarBytes(usado);
    const { valor: valorLivre, unidade: unidadeLivre } = this.formatarBytes(livre);

    await this.salvarMetrica(
      'sistema_memoria_total',
      'Memória total do sistema',
      valorTotal,
      { tipo: 'memoria' },
      { unidade: unidadeTotal }
    );

    await this.salvarMetrica(
      'sistema_memoria_usado',
      'Memória em uso',
      valorUsado,
      { tipo: 'memoria' },
      { unidade: unidadeUsado }
    );

    await this.salvarMetrica(
      'sistema_memoria_livre',
      'Memória livre',
      valorLivre,
      { tipo: 'memoria' },
      { unidade: unidadeLivre }
    );

    await this.salvarMetrica(
      'sistema_memoria_percentual',
      'Percentual de uso da memória',
      percentual,
      { tipo: 'memoria' },
      { unidade: '%' }
    );
  }

  private async coletarDisco(): Promise<void> {
    // Nota: Esta é uma implementação básica
    // Para produção, usar bibliotecas como node-disk-info
    const { stdout } = await new Promise<{ stdout: string }>((resolve, reject) => {
      require('child_process').exec('wmic logicaldisk get size,freespace,caption', (error: Error, stdout: string) => {
        if (error) reject(error);
        resolve({ stdout });
      });
    });

    const linhas = stdout.trim().split('\n').slice(1);
    for (const linha of linhas) {
      const [unidade, espacoLivre, tamanho] = linha.trim().split(/\s+/);
      if (!unidade || !espacoLivre || !tamanho) continue;

      const total = parseInt(tamanho);
      const livre = parseInt(espacoLivre);
      const usado = total - livre;
      const percentual = (usado / total) * 100;

      const { valor: valorTotal, unidade: unidadeTotal } = this.formatarBytes(total);
      const { valor: valorUsado, unidade: unidadeUsado } = this.formatarBytes(usado);
      const { valor: valorLivre, unidade: unidadeLivre } = this.formatarBytes(livre);

      const tags = { tipo: 'disco', unidade };

      await this.salvarMetrica(
        'sistema_disco_total',
        `Espaço total do disco ${unidade}`,
        valorTotal,
        tags,
        { unidade: unidadeTotal }
      );

      await this.salvarMetrica(
        'sistema_disco_usado',
        `Espaço usado do disco ${unidade}`,
        valorUsado,
        tags,
        { unidade: unidadeUsado }
      );

      await this.salvarMetrica(
        'sistema_disco_livre',
        `Espaço livre do disco ${unidade}`,
        valorLivre,
        tags,
        { unidade: unidadeLivre }
      );

      await this.salvarMetrica(
        'sistema_disco_percentual',
        `Percentual de uso do disco ${unidade}`,
        percentual,
        tags,
        { unidade: '%' }
      );
    }
  }

  private async coletarProcesso(): Promise<void> {
    const memoria = process.memoryUsage();
    const uptime = process.uptime();
    const { valor: valorUptime, unidade: unidadeUptime } = this.formatarDuracao(uptime * 1000);

    // Heap usado
    const { valor: valorHeapUsado, unidade: unidadeHeapUsado } = this.formatarBytes(memoria.heapUsed);
    await this.salvarMetrica(
      'sistema_processo_heap_usado',
      'Heap usado pelo processo',
      valorHeapUsado,
      { tipo: 'processo' },
      { unidade: unidadeHeapUsado }
    );

    // Heap total
    const { valor: valorHeapTotal, unidade: unidadeHeapTotal } = this.formatarBytes(memoria.heapTotal);
    await this.salvarMetrica(
      'sistema_processo_heap_total',
      'Heap total alocado',
      valorHeapTotal,
      { tipo: 'processo' },
      { unidade: unidadeHeapTotal }
    );

    // RSS (Resident Set Size)
    const { valor: valorRSS, unidade: unidadeRSS } = this.formatarBytes(memoria.rss);
    await this.salvarMetrica(
      'sistema_processo_rss',
      'Memória residente do processo',
      valorRSS,
      { tipo: 'processo' },
      { unidade: unidadeRSS }
    );

    // Uptime
    await this.salvarMetrica(
      'sistema_processo_uptime',
      'Tempo de execução do processo',
      valorUptime,
      { tipo: 'processo' },
      { unidade: unidadeUptime }
    );
  }
}
