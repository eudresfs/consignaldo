import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConciliacaoService } from '../services/conciliacao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IniciarConciliacaoDTO, FiltrarConciliacoesDTO, ConsultarDivergenciasDTO } from '../dtos/conciliacao/conciliacao.dto';
import { StatusConciliacao, IResultadoConciliacao } from '../domain/conciliacao/conciliacao.types';

@ApiTags('Conciliação Bancária')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conciliacao')
export class ConciliacaoController {
  constructor(private readonly conciliacaoService: ConciliacaoService) {}

  @Post('iniciar')
  @Roles('ADMIN', 'FINANCEIRO')
  @ApiOperation({ summary: 'Inicia processo de conciliação bancária' })
  @ApiResponse({ status: 201, description: 'Conciliação iniciada com sucesso' })
  async iniciarConciliacao(@Body() dto: IniciarConciliacaoDTO) {
    return this.conciliacaoService.iniciarConciliacaoDiaria(dto);
  }

  @Get('status')
  @Roles('ADMIN', 'FINANCEIRO', 'CONSULTA')
  @ApiOperation({ summary: 'Consulta status das conciliações' })
  @ApiResponse({ status: 200, description: 'Lista de conciliações' })
  async consultarStatus(@Query() filtros: FiltrarConciliacoesDTO) {
    return this.conciliacaoService.consultarStatus(filtros);
  }

  @Get('divergencias/:transacaoId')
  @Roles('ADMIN', 'FINANCEIRO', 'CONSULTA')
  @ApiOperation({ summary: 'Consulta divergências de uma transação' })
  @ApiResponse({ status: 200, description: 'Divergências encontradas' })
  async consultarDivergencias(@Param() params: ConsultarDivergenciasDTO) {
    return this.conciliacaoService.consultarDivergencias(params.transacaoId);
  }

  @Get('dashboard')
  @Roles('ADMIN', 'FINANCEIRO', 'CONSULTA')
  @ApiOperation({ summary: 'Obtém estatísticas da conciliação' })
  @ApiResponse({ status: 200, description: 'Estatísticas de conciliação' })
  async obterEstatisticas() {
    return this.conciliacaoService.obterEstatisticas();
  }
}