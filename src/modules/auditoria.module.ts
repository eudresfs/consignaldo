import { Module } from '@nestjs/common';
import { AuditoriaService } from '../services/auditoria.service';
import { AuditoriaController } from '../controllers/auditoria.controller';
import { AuditoriaRepository } from '../repositories/auditoria.repository';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Module({
  controllers: [AuditoriaController],
  providers: [
    AuditoriaService,
    AuditoriaRepository,
    PrismaService
  ],
  exports: [AuditoriaService], // Exportando o serviço para ser usado em outros módulos
})
export class AuditoriaModule {}
