import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseNotificacaoProvider } from './base.provider';
import { Notificacao, TipoNotificacao } from '../../../domain/notificacoes/notificacoes.types';

@Injectable()
export class WhatsAppProvider extends BaseNotificacaoProvider {
  tipo = TipoNotificacao.WHATSAPP;
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiUrl = 'https://graph.facebook.com/v17.0';
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
  }

  /**
   * Envia uma notificação via WhatsApp
   * @param notificacao Notificação a ser enviada
   */
  async enviar(notificacao: Notificacao): Promise<void> {
    try {
      const conteudo = notificacao.templateId
        ? this.processarTemplate(notificacao.conteudo, notificacao.dados || {})
        : notificacao.conteudo;

      const telefone = this.formatarTelefone(notificacao.destinatario);

      // Se tiver template do WhatsApp configurado, usa ele
      if (notificacao.dados?.whatsapp?.template) {
        await this.enviarTemplate(
          telefone,
          notificacao.dados.whatsapp.template,
          notificacao.dados.whatsapp.components || []
        );
      } else {
        // Caso contrário, envia mensagem de texto simples
        await this.enviarTexto(telefone, conteudo);
      }

      this.registrarSucesso(notificacao);
    } catch (erro) {
      this.registrarErro(notificacao, erro);
      throw erro;
    }
  }

  /**
   * Valida a configuração do provedor
   */
  async validarConfiguracao(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/${this.phoneNumberId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        }
      );
      return response.status === 200;
    } catch (erro) {
      this.logger.error('Erro ao validar configuração do WhatsApp', erro.stack);
      return false;
    }
  }

  /**
   * Envia mensagem de texto simples
   * @param telefone Número do telefone formatado
   * @param texto Texto da mensagem
   */
  private async enviarTexto(telefone: string, texto: string): Promise<void> {
    await axios.post(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: telefone,
        type: 'text',
        text: { body: texto }
      },
      {
        headers: { 
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Envia mensagem usando template
   * @param telefone Número do telefone formatado
   * @param template Nome do template
   * @param components Componentes do template
   */
  private async enviarTemplate(
    telefone: string,
    template: string,
    components: any[]
  ): Promise<void> {
    await axios.post(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: telefone,
        type: 'template',
        template: {
          name: template,
          language: {
            code: 'pt_BR'
          },
          components
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Formata o número de telefone para o padrão do WhatsApp
   * @param telefone Número do telefone a ser formatado
   */
  private formatarTelefone(telefone: string): string {
    // Remove todos os caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');

    // Se já começar com +, retorna como está
    if (telefone.startsWith('+')) {
      return telefone;
    }

    // Se começar com 0, remove o 0
    if (numeros.startsWith('0')) {
      return `+55${numeros.slice(1)}`;
    }

    // Se tiver 11 dígitos (com DDD), adiciona +55
    if (numeros.length === 11) {
      return `+55${numeros}`;
    }

    // Se tiver 9 dígitos (sem DDD), adiciona +55 e DDD padrão
    if (numeros.length === 9) {
      return `+5511${numeros}`;
    }

    return `+55${numeros}`;
  }
}
