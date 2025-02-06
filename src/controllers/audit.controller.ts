import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ParseDatePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { AuthGuard } from '../infrastructure/auth/auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../infrastructure/auth/roles.decorator';
import { RateLimit } from '../infrastructure/rate-limit/rate-limit.decorator';
import { 
  AuditEvent,
  AuditFilter,
  AuditStats,
} from '../domain/interfaces/audit.interface';
import { AuditAction } from '../domain/enums/audit-action.enum';
import { AuditResource } from '../domain/enums/audit-resource.enum';

@ApiTags('Auditoria')
@Controller('audit')
@UseGuards(AuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN', 'AUDITOR')
  @RateLimit({ points: 50, duration: 60 })
  @ApiOperation({ summary: 'Busca eventos de auditoria' })
  @ApiResponse({ status: HttpStatus.OK, type: [AuditEvent] })
  async search(
    @Query('startDate', ParseDatePipe) startDate?: Date,
    @Query('endDate', ParseDatePipe) endDate?: Date,
    @Query('action') action?: AuditAction,
    @Query('resource') resource?: AuditResource,
    @Query('resourceId') resourceId?: string,
    @Query('userId') userId?: number,
    @Query('username') username?: string,
    @Query('consignanteId') consignanteId?: number,
    @Query('status') status?: 'SUCCESS' | 'ERROR',
  ): Promise<AuditEvent[]> {
    const filter: AuditFilter = {
      startDate,
      endDate,
      action,
      resource,
      resourceId,
      userId,
      username,
      consignanteId,
      status,
    };

    return this.auditService.search(filter);
  }

  @Get('stats')
  @Roles('ADMIN', 'AUDITOR')
  @RateLimit({ points: 10, duration: 60 })
  @ApiOperation({ summary: 'Obtém estatísticas de auditoria' })
  @ApiResponse({ status: HttpStatus.OK, type: AuditStats })
  async getStats(
    @Query('startDate', ParseDatePipe) startDate: Date,
    @Query('endDate', ParseDatePipe) endDate?: Date,
  ): Promise<AuditStats> {
    return this.auditService.getStats(startDate, endDate);
  }
}
