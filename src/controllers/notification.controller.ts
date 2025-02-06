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
import { NotificationService } from '../services/notification.service';
import { AuthGuard } from '../infrastructure/auth/auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../infrastructure/auth/roles.decorator';
import { RateLimit } from '../infrastructure/rate-limit/rate-limit.decorator';
import {
  NotificationTemplate,
  NotificationConfig,
  NotificationData,
  NotificationResult,
} from '../domain/interfaces/notification.interface';
import { NotificationType } from '../domain/enums/notification-type.enum';
import { NotificationEvent } from '../domain/enums/notification-event.enum';

@ApiTags('Notificações')
@Controller('notifications')
@UseGuards(AuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Roles('ADMIN', 'GESTOR', 'SISTEMA')
  @RateLimit({ points: 100, duration: 60 })
  @ApiOperation({ summary: 'Envia uma notificação' })
  @ApiResponse({ status: HttpStatus.CREATED, type: [NotificationResult] })
  async notify(
    @Body() data: NotificationData
  ): Promise<NotificationResult[]> {
    return this.notificationService.notify(data);
  }

  @Get('templates')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista templates disponíveis' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotificationTemplate] })
  async listTemplates(
    @Query('tipo') tipo?: NotificationType,
    @Query('evento') evento?: NotificationEvent
  ): Promise<NotificationTemplate[]> {
    return this.notificationService.getTemplates(tipo, evento);
  }

  @Post('templates')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cria novo template' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NotificationTemplate })
  async createTemplate(
    @Body() template: NotificationTemplate
  ): Promise<NotificationTemplate> {
    return this.notificationService.createTemplate(template);
  }

  @Put('templates/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza template existente' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationTemplate })
  async updateTemplate(
    @Param('id') id: number,
    @Body() template: NotificationTemplate
  ): Promise<NotificationTemplate> {
    return this.notificationService.updateTemplate(id, template);
  }

  @Delete('templates/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove template' })
  async deleteTemplate(@Param('id') id: number): Promise<void> {
    await this.notificationService.deleteTemplate(id);
  }

  @Get('configs')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista configurações' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotificationConfig] })
  async listConfigs(
    @Query('tipo') tipo?: NotificationType,
    @Query('evento') evento?: NotificationEvent
  ): Promise<NotificationConfig[]> {
    return this.notificationService.getConfigs(tipo, evento);
  }

  @Post('configs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cria nova configuração' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NotificationConfig })
  async createConfig(
    @Body() config: NotificationConfig
  ): Promise<NotificationConfig> {
    return this.notificationService.createConfig(config);
  }

  @Put('configs/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza configuração existente' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationConfig })
  async updateConfig(
    @Param('id') id: number,
    @Body() config: NotificationConfig
  ): Promise<NotificationConfig> {
    return this.notificationService.updateConfig(id, config);
  }

  @Delete('configs/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove configuração' })
  async deleteConfig(@Param('id') id: number): Promise<void> {
    await this.notificationService.deleteConfig(id);
  }
}
