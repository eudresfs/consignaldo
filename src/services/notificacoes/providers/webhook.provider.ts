import { Injectable } from '@nestjs/common';
import { BaseNotificacaoProvider } from './base.provider';
import { Notificacao, TipoNotificacao } from '../../../domain/notificacoes/notificacoes.types';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookProvider extends BaseNotificacaoProvider {
  tipo = TipoNotificacao.WEBHOOK;

  /**
   * Envia uma notificação via webhook
   * @param notificacao Notificação a ser enviada
   */
  async enviar(notificacao: Notificacao): Promise<void> {
    try {
      const webhook = notificacao.dados?.webhook;
      if (!webhook?.url) {
        throw new Error('URL do webhook não fornecida');
      }

      const payload = {
        id: notificacao.id,
        tipo: notificacao.tipo,
        titulo: notificacao.titulo,
        conteudo: notificacao.conteudo,
        dados: notificacao.dados,
        timestamp: new Date().toISOString()
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Consignaldo-Webhook/1.0',
        ...webhook.headers
      };

      // Adiciona assinatura se houver secretKey
      if (webhook.secretKey) {
        const signature = this.gerarAssinatura(payload, webhook.secretKey);
        headers['X-Webhook-Signature'] = signature;
      }

      await axios.post(webhook.url, payload, { headers });
      this.registrarSucesso(notificacao);
    } catch (erro) {
      this.registrarErro(notificacao, erro);
      throw erro;
    }
  }

  /**
   * Valida a configuração do webhook
   */
  async validarConfiguracao(): Promise<boolean> {
    return true; // Webhooks não requerem validação prévia
  }

  /**
   * Gera assinatura HMAC para o payload
   * @param payload Dados a serem assinados
   * @param secretKey Chave secreta para assinatura
   */
  private gerarAssinatura(payload: any, secretKey: string): string {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}
