import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesModule as NotificacoesServiceModule } from '../../services/notificacoes/notificacoes.module';

@Module({
  imports: [NotificacoesServiceModule],
  controllers: [NotificacoesController],
  exports: []
})
export class NotificacoesModule {}
