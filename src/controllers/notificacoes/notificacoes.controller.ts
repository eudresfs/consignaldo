import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';
import { NotificacoesService } from '../../services/notificacoes/notificacoes.service';
import {
  CriarNotificacaoDto,
  CriarTemplateDto,
  AtualizarTemplateDto,
  CriarWebhookDto,
  AtualizarWebhookDto,
  CriarAgendamentoDto,
  AtualizarAgendamentoDto,
  ListarNotificacoesQueryDto,
  ListarTemplatesQueryDto,
  ResolverNotificacaoDto
} from './notificacoes.dto';

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Post()
  @Roles('ADMIN', 'SISTEMA')
  @ApiOperation({ summary: 'Cria uma nova notificação' })
  @ApiResponse({ status: 201, description: 'Notificação criada com sucesso' })
  async criarNotificacao(@Body() dto: CriarNotificacaoDto) {
    return this.notificacoesService.criarNotificacao(dto);
  }

  @Get()
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista notificações com filtros' })
  async listarNotificacoes(@Query() query: ListarNotificacoesQueryDto) {
    return this.notificacoesService.listarNotificacoes(
      query.tipo,
      query.inicio,
      query.fim,
      query.limite,
      query.offset
    );
  }

  @Get('estatisticas')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Retorna estatísticas de notificações' })
  async getEstatisticas(
    @Query('inicio') inicio?: Date,
    @Query('fim') fim?: Date
  ) {
    return this.notificacoesService.getEstatisticas(inicio, fim);
  }

  // Templates
  @Post('templates')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cria um novo template' })
  async criarTemplate(@Body() dto: CriarTemplateDto) {
    return this.notificacoesService.criarTemplate(dto);
  }

  @Get('templates')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista templates com filtros' })
  async listarTemplates(@Query() query: ListarTemplatesQueryDto) {
    return this.notificacoesService.listarTemplates(
      query.tipo,
      query.status,
      query.busca,
      query.limite,
      query.offset
    );
  }

  @Put('templates/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza um template' })
  async atualizarTemplate(
    @Param('id') id: string,
    @Body() dto: AtualizarTemplateDto
  ) {
    return this.notificacoesService.atualizarTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove um template' })
  async removerTemplate(@Param('id') id: string) {
    return this.notificacoesService.removerTemplate(id);
  }

  // Webhooks
  @Post('webhooks')
  @Roles('ADMIN', 'SISTEMA')
  @ApiOperation({ summary: 'Cria um novo webhook' })
  async criarWebhook(@Body() dto: CriarWebhookDto) {
    return this.notificacoesService.criarWebhook(dto);
  }

  @Get('webhooks')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista webhooks ativos' })
  async listarWebhooks() {
    return this.notificacoesService.listarWebhooks();
  }

  @Put('webhooks/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza um webhook' })
  async atualizarWebhook(
    @Param('id') id: string,
    @Body() dto: AtualizarWebhookDto
  ) {
    return this.notificacoesService.atualizarWebhook(id, dto);
  }

  @Delete('webhooks/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove um webhook' })
  async removerWebhook(@Param('id') id: string) {
    return this.notificacoesService.removerWebhook(id);
  }

  // Agendamentos
  @Post('agendamentos')
  @Roles('ADMIN', 'SISTEMA')
  @ApiOperation({ summary: 'Cria um novo agendamento' })
  async criarAgendamento(@Body() dto: CriarAgendamentoDto) {
    return this.notificacoesService.criarAgendamento(dto);
  }

  @Get('agendamentos')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista agendamentos ativos' })
  async listarAgendamentos() {
    return this.notificacoesService.listarAgendamentos();
  }

  @Put('agendamentos/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza um agendamento' })
  async atualizarAgendamento(
    @Param('id') id: string,
    @Body() dto: AtualizarAgendamentoDto
  ) {
    return this.notificacoesService.atualizarAgendamento(id, dto);
  }

  @Delete('agendamentos/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove um agendamento' })
  async removerAgendamento(@Param('id') id: string) {
    return this.notificacoesService.removerAgendamento(id);
  }

  // Ações específicas
  @Post(':id/reenviar')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reenvia uma notificação' })
  async reenviarNotificacao(@Param('id') id: string) {
    return this.notificacoesService.reenviarNotificacao(id);
  }

  @Post(':id/cancelar')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cancela uma notificação' })
  async cancelarNotificacao(@Param('id') id: string) {
    return this.notificacoesService.cancelarNotificacao(id);
  }

  @Post(':id/resolver')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Resolve uma notificação com erro' })
  async resolverNotificacao(
    @Param('id') id: string,
    @Body() dto: ResolverNotificacaoDto
  ) {
    return this.notificacoesService.resolverNotificacao(id, dto.observacao);
  }
}
