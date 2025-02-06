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
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiPublicaService } from '../services/api-publica.service';
import {
  CriarApiKeyDTO,
  AtualizarApiKeyDTO,
  WebhookConfigDTO,
  FiltrosLogDTO,
  PaginacaoDTO
} from '../dtos/api-publica/api-publica.dto';

@ApiTags('API Pública')
@Controller('api-publica')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApiPublicaController {
  constructor(private readonly service: ApiPublicaService) {}

  @Post('api-keys')
  @ApiOperation({ summary: 'Criar nova API Key' })
  @ApiResponse({ status: 201, description: 'API Key criada com sucesso' })
  @Roles('ADMIN')
  async criarApiKey(@Body() dto: CriarApiKeyDTO, @Request() req) {
    return this.service.criarApiKey(dto, req.user.id);
  }

  @Put('api-keys/:id')
  @ApiOperation({ summary: 'Atualizar API Key existente' })
  @ApiResponse({ status: 200, description: 'API Key atualizada com sucesso' })
  @Roles('ADMIN')
  async atualizarApiKey(
    @Param('id') id: string,
    @Body() dto: AtualizarApiKeyDTO,
    @Request() req
  ) {
    return this.service.atualizarApiKey(id, dto, req.user.id);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'Listar API Keys' })
  @ApiResponse({ status: 200, description: 'Lista de API Keys' })
  @Roles('ADMIN')
  async listarApiKeys(@Query() paginacao: PaginacaoDTO) {
    return this.service.listarApiKeys(paginacao);
  }

  @Post('api-keys/:id/webhooks')
  @ApiOperation({ summary: 'Configurar webhook para API Key' })
  @ApiResponse({ status: 201, description: 'Webhook configurado com sucesso' })
  @Roles('ADMIN')
  async configurarWebhook(
    @Param('id') apiKeyId: string,
    @Body() dto: WebhookConfigDTO,
    @Request() req
  ) {
    return this.service.configurarWebhook(apiKeyId, dto, req.user.id);
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: 'Atualizar configuração de webhook' })
  @ApiResponse({ status: 200, description: 'Webhook atualizado com sucesso' })
  @Roles('ADMIN')
  async atualizarWebhook(
    @Param('id') id: string,
    @Body() dto: Partial<WebhookConfigDTO>,
    @Request() req
  ) {
    return this.service.atualizarWebhook(id, dto, req.user.id);
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Remover webhook' })
  @ApiResponse({ status: 204, description: 'Webhook removido com sucesso' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerWebhook(@Param('id') id: string, @Request() req) {
    await this.service.removerWebhook(id, req.user.id);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Buscar logs de integração' })
  @ApiResponse({ status: 200, description: 'Lista de logs' })
  @Roles('ADMIN', 'SUPORTE')
  async buscarLogs(
    @Query() filtros: FiltrosLogDTO,
    @Query() paginacao: PaginacaoDTO
  ) {
    return this.service.buscarLogs(filtros, paginacao);
  }

  @Get('api-keys/:id/metricas')
  @ApiOperation({ summary: 'Obter métricas de uso da API Key' })
  @ApiResponse({ status: 200, description: 'Métricas de uso' })
  @Roles('ADMIN', 'SUPORTE')
  async obterMetricas(
    @Param('id') apiKeyId: string,
    @Query('periodo') periodo: string
  ) {
    return this.service.obterMetricas(apiKeyId, periodo);
  }
}
