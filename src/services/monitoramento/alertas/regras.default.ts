import { TipoAlerta, SeveridadeAlerta } from '../../../domain/monitoramento/monitoramento.types';

/**
 * Regras de alerta padrão para o sistema
 */
export const REGRAS_DEFAULT = [
  // CPU
  {
    nome: 'CPU - Uso Alto',
    descricao: 'Alerta quando o uso de CPU está muito alto',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'sistema_cpu_uso',
    severidade: SeveridadeAlerta.WARNING,
    condicao: '> 80',
    intervalo: 300, // 5 minutos
    notificar: ['ADMIN']
  },
  {
    nome: 'CPU - Uso Crítico',
    descricao: 'Alerta quando o uso de CPU está crítico',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'sistema_cpu_uso',
    severidade: SeveridadeAlerta.CRITICAL,
    condicao: '> 95',
    intervalo: 300,
    notificar: ['ADMIN', 'DEVOPS']
  },

  // Memória
  {
    nome: 'Memória - Uso Alto',
    descricao: 'Alerta quando o uso de memória está alto',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'sistema_memoria_percentual',
    severidade: SeveridadeAlerta.WARNING,
    condicao: '> 85',
    intervalo: 300,
    notificar: ['ADMIN']
  },
  {
    nome: 'Memória - Uso Crítico',
    descricao: 'Alerta quando o uso de memória está crítico',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'sistema_memoria_percentual',
    severidade: SeveridadeAlerta.CRITICAL,
    condicao: '> 95',
    intervalo: 300,
    notificar: ['ADMIN', 'DEVOPS']
  },

  // Disco
  {
    nome: 'Disco - Espaço Baixo',
    descricao: 'Alerta quando o espaço em disco está baixo',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'sistema_disco_percentual',
    severidade: SeveridadeAlerta.WARNING,
    condicao: '> 85',
    intervalo: 3600, // 1 hora
    notificar: ['ADMIN']
  },
  {
    nome: 'Disco - Espaço Crítico',
    descricao: 'Alerta quando o espaço em disco está crítico',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'sistema_disco_percentual',
    severidade: SeveridadeAlerta.CRITICAL,
    condicao: '> 95',
    intervalo: 3600,
    notificar: ['ADMIN', 'DEVOPS']
  },

  // Aplicação - Requests
  {
    nome: 'Requests - Latência Alta',
    descricao: 'Alerta quando a latência das requisições está alta',
    tipo: TipoAlerta.ANOMALIA,
    metricaNome: 'aplicacao_request_duracao_percentis',
    severidade: SeveridadeAlerta.WARNING,
    condicao: '> 2',
    intervalo: 300,
    notificar: ['ADMIN']
  },
  {
    nome: 'Requests - Taxa de Erro',
    descricao: 'Alerta quando a taxa de erro está alta',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'aplicacao_request_erros',
    severidade: SeveridadeAlerta.ERROR,
    condicao: '> 5',
    intervalo: 300,
    notificar: ['ADMIN', 'DEVOPS']
  },

  // Banco de Dados
  {
    nome: 'Database - Taxa de Erro',
    descricao: 'Alerta quando há muitos erros de banco',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'aplicacao_db_erros',
    severidade: SeveridadeAlerta.ERROR,
    condicao: '> 2',
    intervalo: 300,
    notificar: ['ADMIN', 'DBA']
  },
  {
    nome: 'Database - Conexões',
    descricao: 'Alerta quando há muitas conexões',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'aplicacao_db_conexoes',
    severidade: SeveridadeAlerta.WARNING,
    condicao: '> 80',
    intervalo: 300,
    notificar: ['ADMIN', 'DBA']
  },

  // Cache
  {
    nome: 'Cache - Hit Rate Baixo',
    descricao: 'Alerta quando a taxa de acerto do cache está baixa',
    tipo: TipoAlerta.THRESHOLD,
    metricaNome: 'aplicacao_cache_hit_rate',
    severidade: SeveridadeAlerta.WARNING,
    condicao: '< 50',
    intervalo: 900, // 15 minutos
    notificar: ['ADMIN']
  },
  {
    nome: 'Cache - Tamanho',
    descricao: 'Alerta quando o cache está muito grande',
    tipo: TipoAlerta.TENDENCIA,
    metricaNome: 'aplicacao_cache_tamanho',
    severidade: SeveridadeAlerta.WARNING,
    condicao: '> 0.1',
    intervalo: 3600,
    notificar: ['ADMIN']
  }
];
