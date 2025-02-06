/**
 * Tipos de notificação suportados
 */
export enum TipoNotificacao {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  WEBHOOK = 'WEBHOOK'
}

/**
 * Prioridade da notificação
 */
export enum PrioridadeNotificacao {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA'
}

/**
 * Status da notificação
 */
export enum StatusNotificacao {
  PENDENTE = 'PENDENTE',
  ENVIANDO = 'ENVIANDO',
  ENVIADO = 'ENVIADO',
  ERRO = 'ERRO',
  CANCELADO = 'CANCELADO',
  RESOLVIDO = 'RESOLVIDO'
}

/**
 * Status do template
 */
export enum StatusTemplate {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  RASCUNHO = 'RASCUNHO'
}

/**
 * Interface base para notificações
 */
export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  prioridade: PrioridadeNotificacao;
  status: StatusNotificacao;
  destinatario: string;
  titulo: string;
  conteudo: string;
  templateId?: string;
  template?: Template;
  dados?: Record<string, any>;
  agendadoPara?: Date;
  tentativas: number;
  erro?: string;
  enviadoEm?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Interface para templates de notificação
 */
export interface Template {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoNotificacao;
  assunto: string;
  conteudo: string;
  status: StatusTemplate;
  dados?: Record<string, any>;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Interface para provedores de notificação
 */
export interface NotificacaoProvider {
  tipo: TipoNotificacao;
  enviar(notificacao: Notificacao): Promise<void>;
  validarConfiguracao(): Promise<boolean>;
}

/**
 * Interface para configuração de provedores
 */
export interface ProviderConfig {
  tipo: TipoNotificacao;
  ativo: boolean;
  credenciais: Record<string, string>;
  configuracoes: Record<string, any>;
  retry?: {
    tentativas: number;
    intervalo: number;
    multiplicador: number;
  };
}

/**
 * Interface para webhooks
 */
export interface Webhook {
  id: string;
  nome: string;
  url: string;
  segredo: string;
  tipos?: TipoNotificacao[];
  headers?: Record<string, string>;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Interface para agendamento de notificações
 */
export interface Agendamento {
  id: string;
  nome: string;
  descricao: string;
  expressaoCron: string;
  tipo: TipoNotificacao;
  destinatario: string;
  templateId: string;
  template: Template;
  dados?: Record<string, any>;
  ativo: boolean;
  ultimaExecucao?: Date;
  proximaExecucao: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Interface para histórico de notificações
 */
export interface HistoricoNotificacao {
  id: string;
  notificacaoId: string;
  status: StatusNotificacao;
  tentativa: number;
  erro?: string;
  dados: Record<string, any>;
  criadoEm: Date;
}

/**
 * Interface para estatísticas de notificações
 */
export interface EstatisticasNotificacao {
  total: number;
  enviadas: number;
  erros: number;
  taxaSucesso: number;
  tempoMedioEnvio: number;
  porTipo: Record<TipoNotificacao, number>;
  porStatus: Record<StatusNotificacao, number>;
  porPrioridade: Record<PrioridadeNotificacao, number>;
}
