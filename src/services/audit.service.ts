import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { QueueService } from '../infrastructure/queue/queue.service';
import { 
  AuditEvent,
  AuditFilter,
  AuditConfig,
  AuditStats,
} from '../domain/interfaces/audit.interface';
import { AuditAction } from '../domain/enums/audit-action.enum';
import { AuditResource } from '../domain/enums/audit-resource.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditService {
  private readonly config: AuditConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly queue: QueueService,
    configService: ConfigService,
  ) {
    this.config = configService.get<AuditConfig>('audit');
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const resourceConfig = this.config.resources[event.resource];
      if (!resourceConfig?.actions.includes(event.action)) {
        return;
      }

      const auditEvent: AuditEvent = {
        ...event,
        id: uuidv4(),
        timestamp: new Date(),
      };

      // Mascara campos sensíveis
      if (resourceConfig.maskFields?.length) {
        auditEvent.oldValue = this.maskSensitiveData(
          auditEvent.oldValue,
          resourceConfig.maskFields
        );
        auditEvent.newValue = this.maskSensitiveData(
          auditEvent.newValue,
          resourceConfig.maskFields
        );
      }

      // Adiciona à fila para processamento assíncrono
      await this.queue.add('audit', auditEvent, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
    } catch (error) {
      this.logger.error(
        'Erro ao registrar evento de auditoria',
        error.stack,
        'AuditService',
        { resource: event.resource, action: event.action }
      );
    }
  }

  async search(filter: AuditFilter): Promise<AuditEvent[]> {
    const where = this.buildWhereClause(filter);

    return this.prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: 1000, // Limite para não sobrecarregar
    });
  }

  async getStats(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<AuditStats> {
    const [
      totalEvents,
      actionStats,
      resourceStats,
      statusStats,
      topUsers,
      topErrors,
    ] = await Promise.all([
      // Total de eventos
      this.prisma.auditLog.count({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Contagem por ação
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),

      // Contagem por recurso
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),

      // Contagem por status
      this.prisma.auditLog.groupBy({
        by: ['status'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),

      // Top usuários
      this.prisma.auditLog.groupBy({
        by: ['userId', 'username'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          userId: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),

      // Top erros
      this.prisma.auditLog.groupBy({
        by: ['error'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          status: 'ERROR',
          error: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            error: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      periodStart: startDate,
      periodEnd: endDate,
      byAction: this.transformGroupStats(actionStats),
      byResource: this.transformGroupStats(resourceStats),
      byStatus: {
        success: statusStats.find(s => s.status === 'SUCCESS')?._count || 0,
        error: statusStats.find(s => s.status === 'ERROR')?._count || 0,
      },
      topUsers: topUsers.map(u => ({
        userId: u.userId,
        username: u.username,
        count: u._count,
      })),
      topErrors: topErrors.map(e => ({
        error: e.error,
        count: e._count,
      })),
    };
  }

  async cleanup(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention.days);

    await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });
  }

  private buildWhereClause(filter: AuditFilter): any {
    const where: any = {};

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) {
        where.timestamp.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.timestamp.lte = filter.endDate;
      }
    }

    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.resource) {
      where.resource = filter.resource;
    }

    if (filter.resourceId) {
      where.resourceId = filter.resourceId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.username) {
      where.username = {
        contains: filter.username,
        mode: 'insensitive',
      };
    }

    if (filter.consignanteId) {
      where.consignanteId = filter.consignanteId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    return where;
  }

  private transformGroupStats(
    stats: Array<{ [key: string]: any; _count: number }>
  ): Record<string, number> {
    return stats.reduce((acc, curr) => {
      const key = Object.keys(curr).find(k => k !== '_count');
      acc[curr[key]] = curr._count;
      return acc;
    }, {});
  }

  private maskSensitiveData(
    data: any,
    fields: string[]
  ): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const masked = { ...data };
    for (const field of fields) {
      if (field in masked) {
        masked[field] = '***';
      }
    }

    return masked;
  }
}
