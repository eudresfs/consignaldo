import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentoController } from '../controllers/documento.controller';
import { DocumentoService } from '../services/documento.service';
import { DocumentoRepository } from '../repositories/documento.repository';
import { StorageService } from '../services/storage/storage.service';
import { AuditoriaModule } from './auditoria.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get('MAX_FILE_SIZE', 5 * 1024 * 1024) // 5MB default
        }
      }),
      inject: [ConfigService],
    }),
    AuditoriaModule
  ],
  controllers: [DocumentoController],
  providers: [
    DocumentoService,
    DocumentoRepository,
    StorageService,
    PrismaService
  ],
  exports: [DocumentoService] // Exportando o serviço para ser usado em outros módulos
})
export class DocumentoModule {}
