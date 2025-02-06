import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { BaseNotificacaoProvider } from './base.provider';
import { Notificacao, TipoNotificacao } from '../../../domain/notificacoes/notificacoes.types';

@Injectable()
export class EmailProvider extends BaseNotificacaoProvider {
  tipo = TipoNotificacao.EMAIL;
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    super();
    this.inicializarTransporter();
  }

  /**
   * Inicializa o transporter do Nodemailer
   */
  private inicializarTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS')
      }
    });
  }

  /**
   * Envia uma notificação por email
   * @param notificacao Notificação a ser enviada
   */
  async enviar(notificacao: Notificacao): Promise<void> {
    try {
      const conteudo = notificacao.templateId
        ? this.processarTemplate(notificacao.conteudo, notificacao.dados || {})
        : notificacao.conteudo;

      const html = notificacao.template?.html
        ? this.processarTemplate(notificacao.template.html, notificacao.dados || {})
        : undefined;

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: notificacao.destinatario,
        subject: notificacao.titulo,
        text: conteudo,
        html: html
      });

      this.registrarSucesso(notificacao);
    } catch (erro) {
      this.registrarErro(notificacao, erro);
      throw erro;
    }
  }

  /**
   * Valida a configuração do provedor de email
   */
  async validarConfiguracao(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (erro) {
      this.logger.error('Erro ao validar configuração do SMTP', erro.stack);
      return false;
    }
  }
}
