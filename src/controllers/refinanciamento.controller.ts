import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RefinanciamentoService } from '../services/refinanciamento.service';
import {
  SimularRefinanciamentoDTO,
  CriarRefinanciamentoDTO,
  AtualizarRefinanciamentoDTO,
  AnalisarRefinanciamentoDTO,
  ListarRefinanciamentosDTO
} from '../dtos/refinanciamento/refinanciamento.dto';

@ApiTags('Refinanciamento')
@Controller('refinanciamento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RefinanciamentoController {
  constructor(private readonly refinanciamentoService: RefinanciamentoService) {}

  @Post('simular')
  @ApiOperation({ summary: 'Simular refinanciamento' })
  @ApiResponse({ status: 200, description: 'Simulação realizada com sucesso' })
  @Roles('ADMIN', 'OPERADOR')
  async simular(@Body() dto: SimularRefinanciamentoDTO) {
    return this.refinanciamentoService.simular(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Criar refinanciamento' })
  @ApiResponse({ status: 201, description: 'Refinanciamento criado com sucesso' })
  @Roles('ADMIN', 'OPERADOR')
  async criar(
    @Body() dto: CriarRefinanciamentoDTO,
    @Request() req
  ) {
    return this.refinanciamentoService.criar(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar refinanciamento' })
  @ApiResponse({ status: 200, description: 'Refinanciamento atualizado com sucesso' })
  @Roles('ADMIN', 'OPERADOR')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarRefinanciamentoDTO,
    @Request() req
  ) {
    return this.refinanciamentoService.atualizar(id, dto, req.user.id);
  }

  @Patch(':id/analisar')
  @ApiOperation({ summary: 'Analisar refinanciamento' })
  @ApiResponse({ status: 200, description: 'Refinanciamento analisado com sucesso' })
  @Roles('ADMIN', 'ANALISTA')
  async analisar(
    @Param('id') id: string,
    @Body() dto: AnalisarRefinanciamentoDTO,
    @Request() req
  ) {
    return this.refinanciamentoService.analisar(id, dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar refinanciamentos' })
  @ApiResponse({ status: 200, description: 'Lista de refinanciamentos' })
  @Roles('ADMIN', 'OPERADOR', 'ANALISTA')
  async listar(@Query() filtros: ListarRefinanciamentosDTO) {
    return this.refinanciamentoService.listar(filtros);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas de refinanciamentos' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos refinanciamentos' })
  @Roles('ADMIN', 'GERENTE')
  async obterEstatisticas(@Query() filtros: ListarRefinanciamentosDTO) {
    return this.refinanciamentoService.obterEstatisticas(filtros);
  }
}
