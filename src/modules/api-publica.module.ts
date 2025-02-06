import { Module } from '@nestjs/common';
import { ApiPublicaController } from '../controllers/api-publica.controller';
import { ApiPublicaService } from '../services/api-publica.service';
import { ApiPublicaRepository } from '../repositories/api-publica.repository';
import { AuditoriaModule } from './auditoria.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [ApiPublicaController],
  providers: [ApiPublicaService, ApiPublicaRepository, PrismaService],
  exports: [ApiPublicaService]
})
export class ApiPublicaModule {}
