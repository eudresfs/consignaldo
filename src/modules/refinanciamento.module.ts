import { Module } from '@nestjs/common';
import { RefinanciamentoController } from '../controllers/refinanciamento.controller';
import { RefinanciamentoService } from '../services/refinanciamento.service';
import { RefinanciamentoRepository } from '../repositories/refinanciamento.repository';
import { ContratoRepository } from '../repositories/contrato.repository';
import { ServidorRepository } from '../repositories/servidor.repository';
import { DocumentoModule } from './documento.module';
import { AuditoriaModule } from './auditoria.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { BancoIntegrationFactory } from '../services/bancos/banco-integration.factory';

@Module({
  imports: [
    DocumentoModule,
    AuditoriaModule
  ],
  controllers: [RefinanciamentoController],
  providers: [
    RefinanciamentoService,
    RefinanciamentoRepository,
    ContratoRepository,
    ServidorRepository,
    PrismaService,
    BancoIntegrationFactory
  ],
  exports: [RefinanciamentoService]
})
export class RefinanciamentoModule {}
