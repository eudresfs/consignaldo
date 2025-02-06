import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HttpHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthCheck,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../infrastructure/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar status da API' })
  @ApiResponse({ 
    status: 200, 
    description: 'API está funcionando normalmente',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok'
        },
        timestamp: {
          type: 'string',
          example: new Date().toISOString()
        }
      }
    }
  })
  check() {
    return this.health.check([
      // Banco de dados
      () => this.prismaHealth.pingCheck('database', this.prisma),
      
      // Uso de disco
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.9 
      }),
      
      // Uso de memória
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),   // 300MB
      
      // APIs externas críticas
      () => this.http.pingCheck('api_consignante', 'https://api.consignante.com.br/health'),
      () => this.http.pingCheck('api_banco', 'https://api.banco.com.br/health'),
    ]);
  }
}
