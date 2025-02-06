import { Module } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../cache.service';
import { EmailProvider, SmsProvider, PushProvider, WhatsAppProvider, WebhookProvider } from './providers';

@Module({
  providers: [
    NotificacoesService,
    PrismaService,
    CacheService,
    EmailProvider,
    SmsProvider,
    PushProvider,
    WhatsAppProvider,
    WebhookProvider
  ],
  exports: [NotificacoesService]
})
export class NotificacoesModule {}
