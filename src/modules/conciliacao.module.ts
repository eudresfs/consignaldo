import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConciliacaoService } from '../services/conciliacao.service';
import { ConciliacaoProcessor } from '../jobs/conciliacao.processor';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { TransacaoBancariaRepository } from '../repositories/transacao-bancaria.repository';
import { ConciliacaoController } from '../controllers/conciliacao.controller';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'conciliacao',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [ConciliacaoController],
  providers: [
    ConciliacaoService,
    ConciliacaoProcessor,
    PrismaService,
    TransacaoBancariaRepository
  ],
  exports: [ConciliacaoService],
})
export class ConciliacaoModule {}
