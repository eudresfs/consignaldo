import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { QueueService } from '../infrastructure/queue/queue.service';
import { 
  NotificationTemplate,
  NotificationConfig,
  NotificationData,
  NotificationResult,
} from '../domain/interfaces/notification.interface';
import { NotificationType } from '../domain/enums/notification-type.enum';
import { NotificationEvent } from '../domain/enums/notification-event.enum';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
  private readonly emailTransporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {
    // Configura transportador de email
    this.emailTransporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get('SMTP_PORT'),
      secure: this.config.get('SMTP_SECURE', true),
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async notify(data: NotificationData): Promise<NotificationResult[]> {
    try {
      // Busca configurações ativas para o evento
      const configs = await this.prisma.notificationConfig.findMany({
        where: {
          evento: data.evento,
          ativo: true,
        },
        include: {
          template: true,
        },
      });

      if (!configs.length) {
        this.logger.warn(
          'Nenhuma configuração encontrada para o evento',
          'NotificationService',
          { evento: data.evento }
        );
        return [];
      }

      // Processa cada configuração
      const results = await Promise.all(
        configs.map(config => this.processNotification(config, data))
      );

      return results;
    } catch (error) {
      this.logger.error(
        'Erro ao processar notificação',
        error.stack,
        'NotificationService',
        { evento: data.evento }
      );
      throw error;
    }
  }

  private async processNotification(
    config: NotificationConfig & { template: NotificationTemplate },
    data: NotificationData
  ): Promise<NotificationResult> {
    const id = uuidv4();
    const result: NotificationResult = {
      id,
      config,
      template: config.template,
      data,
      status: 'PENDENTE',
      tentativas: 0,
    };

    try {
      // Renderiza template
      const content = this.renderTemplate(config.template, data.dados);

      // Envia notificação conforme tipo
      switch (config.tipo) {
        case NotificationType.EMAIL:
          await this.sendEmail(config, content, data);
          break;

        case NotificationType.WEBHOOK:
          await this.sendWebhook(config, data);
          break;

        case NotificationType.PUSH:
          await this.sendPushNotification(config, content, data);
          break;

        // Implementar outros tipos conforme necessário
      }

      result.status = 'ENVIADO';
      result.enviadoEm = new Date();
    } catch (error) {
      result.status = 'ERRO';
      result.erro = error.message;

      // Se configurado retry, adiciona à fila
      if (config.retry && result.tentativas < config.retry.attempts) {
        await this.scheduleRetry(config, data, result.tentativas + 1);
      }

      this.logger.error(
        'Erro ao enviar notificação',
        error.stack,
        'NotificationService',
        { 
          id,
          tipo: config.tipo,
          evento: data.evento
        }
      );
    }

    // Registra resultado
    await this.prisma.notificationLog.create({
      data: {
        id,
        configId: config.id,
        templateId: config.template.id,
        evento: data.evento,
        status: result.status,
        erro: result.erro,
        tentativas: result.tentativas,
        metadata: data.metadata,
      },
    });

    return result;
  }

  private renderTemplate(
    template: NotificationTemplate,
    data: Record<string, any>
  ): string {
    const compile = handlebars.compile(
      template.html || template.conteudo
    );
    return compile(data);
  }

  private async sendEmail(
    config: NotificationConfig,
    content: string,
    data: NotificationData
  ): Promise<void> {
    const destinatarios = data.destinatarios || config.destinatarios;
    if (!destinatarios?.length) {
      throw new Error('Nenhum destinatário configurado');
    }

    await this.emailTransporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: destinatarios.join(', '),
      subject: config.template.assunto,
      html: content,
    });
  }

  private async sendWebhook(
    config: NotificationConfig,
    data: NotificationData
  ): Promise<void> {
    if (!config.webhookUrl) {
      throw new Error('URL do webhook não configurada');
    }

    await axios.post(
      config.webhookUrl,
      {
        evento: data.evento,
        dados: data.dados,
        metadata: data.metadata,
      },
      {
        headers: config.headers,
      }
    );
  }

  private async sendPushNotification(
    config: NotificationConfig,
    content: string,
    data: NotificationData
  ): Promise<void> {
    // Implementar integração com serviço de push
    throw new Error('Não implementado');
  }

  private async scheduleRetry(
    config: NotificationConfig,
    data: NotificationData,
    attempt: number
  ): Promise<void> {
    const delay = config.retry.delay * Math.pow(config.retry.multiplier, attempt - 1);

    await this.queue.add(
      'notification',
      {
        config,
        data,
        attempt,
      },
      {
        delay,
        attempts: 1,
      }
    );
  }

  async getTemplates(
    tipo?: NotificationType,
    evento?: NotificationEvent
  ): Promise<NotificationTemplate[]> {
    return this.prisma.notificationTemplate.findMany({
      where: {
        ...(tipo && { tipo }),
        ...(evento && { evento }),
        ativo: true,
      },
      orderBy: {
        versao: 'desc',
      },
    });
  }

  async createTemplate(
    template: NotificationTemplate
  ): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.create({
      data: template,
    });
  }

  async updateTemplate(
    id: number,
    template: NotificationTemplate
  ): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...template,
        versao: { increment: 1 },
      },
    });
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.prisma.notificationTemplate.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async getConfigs(
    tipo?: NotificationType,
    evento?: NotificationEvent
  ): Promise<NotificationConfig[]> {
    return this.prisma.notificationConfig.findMany({
      where: {
        ...(tipo && { tipo }),
        ...(evento && { evento }),
        ativo: true,
      },
      include: {
        template: true,
      },
    });
  }

  async createConfig(
    config: NotificationConfig
  ): Promise<NotificationConfig> {
    return this.prisma.notificationConfig.create({
      data: config,
      include: {
        template: true,
      },
    });
  }

  async updateConfig(
    id: number,
    config: NotificationConfig
  ): Promise<NotificationConfig> {
    return this.prisma.notificationConfig.update({
      where: { id },
      data: config,
      include: {
        template: true,
      },
    });
  }

  async deleteConfig(id: number): Promise<void> {
    await this.prisma.notificationConfig.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
