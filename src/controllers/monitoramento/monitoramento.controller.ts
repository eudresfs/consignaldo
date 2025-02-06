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
  HttpException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MonitoramentoService } from '../../services/monitoramento/monitoramento.service';
import {
  CreateRegraAlertaDto,
  UpdateRegraAlertaDto,
  QueryMetricasDto,
  QueryAlertasDto
} from './monitoramento.dto';

@ApiTags('Monitoramento')
@Controller('monitoramento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitoramentoController {
  constructor(private readonly monitoramento: MonitoramentoService) {}

  // Métricas
  @Get('metricas')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Lista métricas com filtros' })
  async listarMetricas(@Query() query: QueryMetricasDto) {
    return this.monitoramento.listarMetricas(query);
  }

  @Get('metricas/:nome')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Busca métrica por nome' })
  async buscarMetrica(@Param('nome') nome: string) {
    const metrica = await this.monitoramento.buscarMetrica(nome);
    if (!metrica) {
      throw new HttpException('Métrica não encontrada', HttpStatus.NOT_FOUND);
    }
    return metrica;
  }

  @Get('metricas/:nome/historico')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Histórico de valores de uma métrica' })
  async historicoMetrica(
    @Param('nome') nome: string,
    @Query('inicio') inicio: Date,
    @Query('fim') fim: Date
  ) {
    return this.monitoramento.historicoMetrica(nome, inicio, fim);
  }

  // Regras de Alerta
  @Get('regras')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Lista regras de alerta' })
  async listarRegras() {
    return this.monitoramento.listarRegras();
  }

  @Post('regras')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cria nova regra de alerta' })
  @ApiResponse({ status: 201, description: 'Regra criada com sucesso' })
  async criarRegra(@Body() dto: CreateRegraAlertaDto) {
    return this.monitoramento.criarRegra(dto);
  }

  @Put('regras/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza regra de alerta' })
  async atualizarRegra(
    @Param('id') id: string,
    @Body() dto: UpdateRegraAlertaDto
  ) {
    const regra = await this.monitoramento.atualizarRegra(id, dto);
    if (!regra) {
      throw new HttpException('Regra não encontrada', HttpStatus.NOT_FOUND);
    }
    return regra;
  }

  @Delete('regras/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove regra de alerta' })
  @ApiResponse({ status: 204, description: 'Regra removida com sucesso' })
  async removerRegra(@Param('id') id: string) {
    const removido = await this.monitoramento.removerRegra(id);
    if (!removido) {
      throw new HttpException('Regra não encontrada', HttpStatus.NOT_FOUND);
    }
  }

  // Alertas
  @Get('alertas')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Lista alertas com filtros' })
  async listarAlertas(@Query() query: QueryAlertasDto) {
    return this.monitoramento.listarAlertas(query);
  }

  @Get('alertas/:id')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Busca alerta por ID' })
  async buscarAlerta(@Param('id') id: string) {
    const alerta = await this.monitoramento.buscarAlerta(id);
    if (!alerta) {
      throw new HttpException('Alerta não encontrado', HttpStatus.NOT_FOUND);
    }
    return alerta;
  }

  @Put('alertas/:id/resolver')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resolve um alerta manualmente' })
  async resolverAlerta(
    @Param('id') id: string,
    @Body('observacao') observacao?: string
  ) {
    const alerta = await this.monitoramento.resolverAlerta(id, observacao);
    if (!alerta) {
      throw new HttpException('Alerta não encontrado', HttpStatus.NOT_FOUND);
    }
    return alerta;
  }

  // Dashboard
  @Get('dashboard/resumo')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Resumo do dashboard' })
  async dashboardResumo() {
    return this.monitoramento.getDashboardResumo();
  }

  @Get('dashboard/metricas-chave')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Métricas chave do sistema' })
  async metricasChave() {
    return this.monitoramento.getMetricasChave();
  }

  @Get('dashboard/alertas-recentes')
  @Roles('ADMIN', 'MONITOR')
  @ApiOperation({ summary: 'Alertas mais recentes' })
  async alertasRecentes(@Query('limite') limite: number = 10) {
    return this.monitoramento.getAlertasRecentes(limite);
  }
}
