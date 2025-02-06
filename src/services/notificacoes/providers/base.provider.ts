import { Injectable, Logger } from '@nestjs/common';
import { NotificacaoProvider, Notificacao, TipoNotificacao } from '../../../domain/notificacoes/notificacoes.types';

@Injectable()
export abstract class BaseNotificacaoProvider implements NotificacaoProvider {
  protected readonly logger = new Logger(this.constructor.name);
  abstract tipo: TipoNotificacao;

  /**
   * Envia uma notificação
   * @param notificacao Notificação a ser enviada
   */
  abstract enviar(notificacao: Notificacao): Promise<void>;

  /**
   * Valida a configuração do provedor
   */
  abstract validarConfiguracao(): Promise<boolean>;

  /**
   * Processa variáveis no template
   * @param template Template com variáveis
   * @param dados Dados para substituir as variáveis
   */
  protected processarTemplate(template: string, dados: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const valor = key.split('.').reduce((obj, k) => obj?.[k.trim()], dados);
      return valor !== undefined ? String(valor) : match;
    });
  }

  /**
   * Registra erro de envio
   * @param notificacao Notificação que falhou
   * @param erro Erro ocorrido
   */
  protected registrarErro(notificacao: Notificacao, erro: Error): void {
    this.logger.error(
      `Erro ao enviar notificação ${notificacao.id} para ${notificacao.destinatario}`,
      erro.stack
    );
  }

  /**
   * Registra sucesso de envio
   * @param notificacao Notificação enviada
   */
  protected registrarSucesso(notificacao: Notificacao): void {
    this.logger.log(
      `Notificação ${notificacao.id} enviada com sucesso para ${notificacao.destinatario}`
    );
  }
}
