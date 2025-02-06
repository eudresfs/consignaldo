import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { BaseNotificacaoProvider } from './base.provider';
import { Notificacao, TipoNotificacao } from '../../../domain/notificacoes/notificacoes.types';

@Injectable()
export class SmsProvider extends BaseNotificacaoProvider {
  tipo = TipoNotificacao.SMS;
  private readonly snsClient: SNSClient;

  constructor(private readonly configService: ConfigService) {
    super();
    this.snsClient = new SNSClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')
      }
    });
  }

  /**
   * Envia uma notificação via SMS usando AWS SNS
   * @param notificacao Notificação a ser enviada
   */
  async enviar(notificacao: Notificacao): Promise<void> {
    try {
      const conteudo = notificacao.templateId
        ? this.processarTemplate(notificacao.conteudo, notificacao.dados || {})
        : notificacao.conteudo;

      const command = new PublishCommand({
        Message: conteudo,
        PhoneNumber: this.formatarTelefone(notificacao.destinatario)
      });

      await this.snsClient.send(command);
      this.registrarSucesso(notificacao);
    } catch (erro) {
      this.registrarErro(notificacao, erro as Error);
      throw erro;
    }
  }

  /**
   * Valida a configuração do provedor
   */
  async validarConfiguracao(): Promise<boolean> {
    try {
      // Tenta enviar uma mensagem para um número de teste
      const testNumber = this.configService.get<string>('SMS_TEST_NUMBER');
      if (!testNumber) {
        this.logger.warn('Número de teste não configurado');
        return false;
      }

      const command = new PublishCommand({
        Message: 'Teste de configuração',
        PhoneNumber: testNumber
      });

      await this.snsClient.send(command);
      return true;
    } catch (erro) {
      this.logger.error('Erro ao validar configuração do SMS', erro instanceof Error ? erro.stack : String(erro));
      return false;
    }
  }

  /**
   * Formata o número de telefone para o padrão E.164
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
