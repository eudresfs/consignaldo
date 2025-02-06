import { Controller, Get, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/security/guards/roles.guard';
import { Roles } from '../infrastructure/security/decorators/roles.decorator';
import { Role } from '../domain/enums/role.enum';
import { QueueService } from '../infrastructure/queue/queue.service';
import { MetricsService } from '../services/metrics.service';
import { LoggerService } from '../infrastructure/logger/logger.service';

@ApiTags('Monitoramento')
@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MonitoringController {
  constructor(
    private readonly queueService: QueueService,
    private readonly metricsService: MetricsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('queues/status')
  @ApiOperation({ summary: 'Status das filas de processamento' })
  async getQueuesStatus() {
    const [folhaStats, averbacaoStats] = await Promise.all([
      this.queueService.getQueueStats('folha-pagamento'),
      this.queueService.getQueueStats('averbacao'),
    ]);

    return {
      folhaPagamento: folhaStats,
      averbacao: averbacaoStats,
    };
  }

  @Get('jobs/failed')
  @ApiOperation({ summary: 'Lista jobs com falha' })
  async getFailedJobs(
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('queue') queue?: string,
  ) {
    return this.queueService.getFailedJobs(queue, limit);
  }

  @Get('metrics/integration')
  @ApiOperation({ summary: 'Métricas de integrações' })
  async getIntegrationMetrics(
    @Query('consignanteId', ParseIntPipe) consignanteId?: number,
    @Query('days', ParseIntPipe) days: number = 7,
  ) {
    return this.metricsService.getIntegrationMetrics(consignanteId, days);
  }

  @Get('metrics/performance')
  @ApiOperation({ summary: 'Métricas de performance' })
  async getPerformanceMetrics(
    @Query('days', ParseIntPipe) days: number = 7,
  ) {
    return this.metricsService.getPerformanceMetrics(days);
  }

  @Get('health')
  @ApiOperation({ summary: 'Status geral do sistema' })
  async getHealthStatus() {
    return this.metricsService.getSystemHealth();
  }
}
