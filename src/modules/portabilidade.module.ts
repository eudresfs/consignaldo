import { Module } from '@nestjs/common';
import { PortabilidadeController } from '../controllers/portabilidade.controller';
import { PortabilidadeService } from '../services/portabilidade.service';
import { PortabilidadeRepository } from '../repositories/portabilidade.repository';
import { ContratoRepository } from '../repositories/contrato.repository';
import { ServidorRepository } from '../repositories/servidor.repository';
import { DocumentoModule } from './documento.module';
import { AuditoriaModule } from './auditoria.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { BancoIntegrationFactory } from '../services/bancos/banco-integration.factory';
import { BancoBrasilIntegration } from '../services/bancos/banco-brasil.integration';

@Module({
  imports: [
    DocumentoModule,
    AuditoriaModule
  ],
  controllers: [PortabilidadeController],
  providers: [
    PortabilidadeService,
    PortabilidadeRepository,
    ContratoRepository,
    ServidorRepository,
    PrismaService,
    BancoIntegrationFactory,
    BancoBrasilIntegration
  ],
  exports: [PortabilidadeService]
})
export class PortabilidadeModule {}
