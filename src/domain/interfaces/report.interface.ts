import { ReportType } from '../enums/report-type.enum';
import { ReportFormat } from '../enums/report-format.enum';

export interface ReportConfig {
  id: number;
  nome: string;
  tipo: ReportType;
  formato: ReportFormat;
  agendamento?: string;  // Expressão cron
  filtros?: Record<string, any>;
  template?: string;     // Template HTML/Handlebars
  ativo: boolean;
  consignanteId?: number;
  destinatarios?: string[];
}

export interface ReportResult {
  id: string;
  config: ReportConfig;
  data: any;
  formato: ReportFormat;
  tamanho: number;
  hash: string;
  geradoEm: Date;
  url?: string;
}

export interface ReportTemplate {
  id: number;
  nome: string;
  tipo: ReportType;
  formato: ReportFormat;
  conteudo: string;
  css?: string;
  header?: string;
  footer?: string;
  versao: number;
  ativo: boolean;
}

export interface ReportSchedule {
  id: number;
  reportConfigId: number;
  expressao: string;     // Expressão cron
  ultimaExecucao?: Date;
  proximaExecucao?: Date;
  status: 'ATIVO' | 'PAUSADO' | 'ERRO';
  erro?: string;
}

export interface ReportMetadata {
  totalRegistros: number;
  dataInicio: Date;
  dataFim: Date;
  filtrosAplicados: Record<string, any>;
  tempoProcessamento: number;
  usuario: string;
}
