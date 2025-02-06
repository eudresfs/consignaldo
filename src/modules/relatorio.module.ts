import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RelatorioService } from '../services/relatorio.service';
import { RelatorioProcessor } from '../jobs/relatorio.processor';
import { RelatorioRepository } from '../repositories/relatorio.repository';
import { StorageService } from '../infrastructure/storage/storage.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RelatorioController } from '../controllers/relatorio.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'relatorios',
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
  controllers: [RelatorioController],
  providers: [
    RelatorioService,
    RelatorioProcessor,
    RelatorioRepository,
    StorageService,
    PrismaService
  ],
  exports: [RelatorioService],
})
export class RelatorioModule {}
