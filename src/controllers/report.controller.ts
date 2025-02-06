import { 
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { AuthGuard } from '../infrastructure/auth/auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../infrastructure/auth/roles.decorator';
import { RateLimit } from '../infrastructure/rate-limit/rate-limit.decorator';
import { 
  ReportConfig,
  ReportResult,
  ReportTemplate,
  ReportSchedule,
} from '../domain/interfaces/report.interface';
import { ReportType } from '../domain/enums/report-type.enum';
import { ReportFormat } from '../domain/enums/report-format.enum';

@ApiTags('Relatórios')
@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @Roles('ADMIN', 'GESTOR')
  @RateLimit({ points: 10, duration: 60 })
  @ApiOperation({ summary: 'Gera um novo relatório' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ReportResult })
  async generateReport(
    @Body() config: ReportConfig,
    @Query() filters: Record<string, any>
  ): Promise<ReportResult> {
    return this.reportService.generateReport(config, filters);
  }

  @Get('templates')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista templates disponíveis' })
  @ApiResponse({ status: HttpStatus.OK, type: [ReportTemplate] })
  async listTemplates(
    @Query('tipo') tipo?: ReportType,
    @Query('formato') formato?: ReportFormat
  ): Promise<ReportTemplate[]> {
    return this.reportService.listTemplates(tipo, formato);
  }

  @Post('templates')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cria novo template' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ReportTemplate })
  async createTemplate(
    @Body() template: ReportTemplate
  ): Promise<ReportTemplate> {
    return this.reportService.createTemplate(template);
  }

  @Put('templates/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza template existente' })
  @ApiResponse({ status: HttpStatus.OK, type: ReportTemplate })
  async updateTemplate(
    @Param('id') id: number,
    @Body() template: ReportTemplate
  ): Promise<ReportTemplate> {
    return this.reportService.updateTemplate(id, template);
  }

  @Delete('templates/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove template' })
  async deleteTemplate(@Param('id') id: number): Promise<void> {
    await this.reportService.deleteTemplate(id);
  }

  @Post('schedule')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Agenda geração de relatório' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ReportSchedule })
  async scheduleReport(
    @Body() schedule: ReportSchedule
  ): Promise<ReportSchedule> {
    return this.reportService.scheduleReport(schedule);
  }

  @Get('schedule')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista agendamentos' })
  @ApiResponse({ status: HttpStatus.OK, type: [ReportSchedule] })
  async listSchedules(): Promise<ReportSchedule[]> {
    return this.reportService.listSchedules();
  }

  @Delete('schedule/:id')
  @Roles('ADMIN', 'GESTOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove agendamento' })
  async deleteSchedule(@Param('id') id: number): Promise<void> {
    await this.reportService.deleteSchedule(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR', 'USUARIO')
  @ApiOperation({ summary: 'Busca relatório por ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReportResult })
  async getReport(@Param('id') id: string): Promise<ReportResult> {
    return this.reportService.getReport(id);
  }

  @Get(':id/download')
  @Roles('ADMIN', 'GESTOR', 'USUARIO')
  @ApiOperation({ summary: 'Download do relatório' })
  @ApiResponse({ status: HttpStatus.OK })
  async downloadReport(@Param('id') id: string): Promise<Buffer> {
    return this.reportService.downloadReport(id);
  }
}
