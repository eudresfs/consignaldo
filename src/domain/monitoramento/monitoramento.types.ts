/**
 * Tipos e interfaces para o módulo de Monitoramento
 * @module MonitoramentoTypes
 */

/**
 * Tipos de métricas disponíveis para monitoramento
 */
export enum TipoMetrica {
  CONTADOR = 'CONTADOR',      // Incrementa/decrementa valor
  MEDIDOR = 'MEDIDOR',       // Valor atual (ex: memória em uso)
  HISTOGRAMA = 'HISTOGRAMA', // Distribuição de valores
  RESUMO = 'RESUMO'          // Cálculo de percentis
}

/**
 * Tipos de alertas que podem ser configurados
 */
export enum TipoAlerta {
  THRESHOLD = 'THRESHOLD',    // Limite fixo
  ANOMALIA = 'ANOMALIA',     // Desvio do padrão
  TENDENCIA = 'TENDENCIA'    // Tendência de crescimento
}

/**
 * Níveis de severidade dos alertas
 */
export enum SeveridadeAlerta {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Status possíveis de um alerta
 */
export enum StatusAlerta {
  ATIVO = 'ATIVO',
  RESOLVIDO = 'RESOLVIDO',
  IGNORADO = 'IGNORADO',
  EM_ANALISE = 'EM_ANALISE'
}

/**
 * Interface base para métricas
 */
export interface Metrica {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoMetrica;
  tags: Record<string, string>;
  unidade?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Interface para métricas do tipo contador
 */
export interface MetricaContador extends Metrica {
  tipo: TipoMetrica.CONTADOR;
  valor: number;
  incremento?: number;
}

/**
 * Interface para métricas do tipo medidor
 */
export interface MetricaMedidor extends Metrica {
  tipo: TipoMetrica.MEDIDOR;
  valor: number;
  minimo?: number;
  maximo?: number;
}

/**
 * Interface para métricas do tipo histograma
 */
export interface MetricaHistograma extends Metrica {
  tipo: TipoMetrica.HISTOGRAMA;
  valores: number[];
  buckets: number[];
  contagens: number[];
}

/**
 * Interface para métricas do tipo resumo
 */
export interface MetricaResumo extends Metrica {
  tipo: TipoMetrica.RESUMO;
  valor: number;
  percentis: Record<number, number>;
}

/**
 * Interface para regras de alerta
 */
export interface RegraAlerta {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoAlerta;
  metricaId: string;
  severidade: SeveridadeAlerta;
  condicao: string;
  intervalo: number;
  notificar: string[];
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Interface para ocorrências de alerta
 */
export interface Alerta {
  id: string;
  regraId: string;
  status: StatusAlerta;
  valor: number;
  mensagem: string;
  detalhes?: Record<string, any>;
  criadoEm: Date;
  atualizadoEm: Date;
  resolvidoEm?: Date;
}

/**
 * Interface para dashboards
 */
export interface Dashboard {
  id: string;
  nome: string;
  descricao: string;
  paineis: Painel[];
  compartilhadoCom: string[];
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Interface para painéis em dashboards
 */
export interface Painel {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  metricas: string[];
  configuracao: Record<string, any>;
  posicao: {
    x: number;
    y: number;
    largura: number;
    altura: number;
  };
}

/**
 * Interface para logs estruturados
 */
export interface Log {
  id: string;
  nivel: string;
  mensagem: string;
  contexto: Record<string, any>;
  origem: string;
  timestamp: Date;
  trace?: string;
  usuario?: string;
}

/**
 * Interface para traces distribuídos
 */
export interface Trace {
  id: string;
  nome: string;
  inicio: Date;
  fim: Date;
  duracao: number;
  servico: string;
  operacao: string;
  status: string;
  tags: Record<string, string>;
  spans: Span[];
}

/**
 * Interface para spans em traces
 */
export interface Span {
  id: string;
  parentId?: string;
  nome: string;
  inicio: Date;
  fim: Date;
  duracao: number;
  servico: string;
  operacao: string;
  status: string;
  tags: Record<string, string>;
  eventos: SpanEvent[];
}

/**
 * Interface para eventos em spans
 */
export interface SpanEvent {
  nome: string;
  timestamp: Date;
  atributos: Record<string, any>;
}
