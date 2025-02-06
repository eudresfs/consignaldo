import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { PrismaExceptionFilter } from './infrastructure/prisma/prisma-exceptions.filter';
import { RelatorioModule } from './modules/relatorio.module';
import { AuditoriaModule } from './modules/auditoria.module';
import { DocumentoModule } from './modules/documento.module';
import { PortabilidadeModule } from './modules/portabilidade.module';
import { RefinanciamentoModule } from './modules/refinanciamento.module';
import { ApiPublicaModule } from './modules/api-publica.module';

@Module({
  imports: [
    // Configuração
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Infraestrutura
    LoggerModule,
    CacheModule,
    SecurityModule,
    PrismaModule,
    
    // Funcionalidades
    HealthModule,
    RelatorioModule,
    AuditoriaModule,
    DocumentoModule,
    PortabilidadeModule,
    RefinanciamentoModule,
    ApiPublicaModule,
  ],
  providers: [
    // Filtros Globais
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}