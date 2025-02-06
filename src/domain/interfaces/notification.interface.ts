import { NotificationType } from '../enums/notification-type.enum';
import { NotificationEvent } from '../enums/notification-event.enum';

export interface NotificationTemplate {
  id: number;
  nome: string;
  tipo: NotificationType;
  evento: NotificationEvent;
  assunto?: string;
  conteudo: string;
  html?: string;
  variaveis: string[];
  ativo: boolean;
  versao: number;
}

export interface NotificationConfig {
  id: number;
  nome: string;
  tipo: NotificationType;
  evento: NotificationEvent;
  templateId: number;
  destinatarios?: string[];
  webhookUrl?: string;
  headers?: Record<string, string>;
  retry?: {
    attempts: number;
    delay: number;
    multiplier: number;
  };
  ativo: boolean;
}

export interface NotificationData {
  evento: NotificationEvent;
  dados: Record<string, any>;
  destinatarios?: string[];
  metadata?: {
    origem?: string;
    usuario?: string;
    ip?: string;
    timestamp?: Date;
  };
}

export interface NotificationResult {
  id: string;
  config: NotificationConfig;
  template: NotificationTemplate;
  data: NotificationData;
  status: 'ENVIADO' | 'ERRO' | 'PENDENTE';
  erro?: string;
  tentativas: number;
  enviadoEm?: Date;
}
