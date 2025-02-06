import { Module } from '@nestjs/common';
import { QueueModule } from '../infrastructure/queue/queue.module';
import { IntegrationModule } from '../infrastructure/integration/integration.module';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { LoggerModule } from '../infrastructure/logger/logger.module';
import { FolhaPagamentoProcessor } from './folha-pagamento.processor';
import { AverbacaoProcessor } from './averbacao.processor';

@Module({
  imports: [
    QueueModule,
    IntegrationModule,
    PrismaModule,
    LoggerModule,
  ],
  providers: [
    FolhaPagamentoProcessor,
    AverbacaoProcessor,
  ],
})
export class JobsModule {}
