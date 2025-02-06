import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

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
  ],
})
export class AppModule {}
