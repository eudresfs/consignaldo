import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Req,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { PortabilidadeService } from '../services/portabilidade.service';
import {
  SimularPortabilidadeDTO,
  CriarPortabilidadeDTO,
  AtualizarPortabilidadeDTO,
  AnalisarPortabilidadeDTO,
  FiltrarPortabilidadeDTO
} from '../dtos/portabilidade/portabilidade.dto';
import { Request } from 'express';

@ApiTags('Portabilidade')
@Controller('portabilidade')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortabilidadeController {
  constructor(private readonly portabilidadeService: PortabilidadeService) {}

  @Post('simular')
  @ApiOperation({ summary: 'Simular portabilidade' })
  @ApiResponse({ status: 200, description: 'Simulação realizada com sucesso' })
  @Roles('ADMIN', 'GESTOR', 'ANALISTA', 'ATENDENTE')
  async simular(@Body() dto: SimularPortabilidadeDTO) {
    return this.portabilidadeService.simular(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Criar solicitação de portabilidade' })
  @ApiResponse({ status: 201, description: 'Portabilidade criada com sucesso' })
  @Roles('ADMIN', 'GESTOR', 'ANALISTA', 'ATENDENTE')
  async criar(
    @Body() dto: CriarPortabilidadeDTO,
    @Req() request: Request
  ) {
    const usuarioId = request['user'].id;
    return this.portabilidadeService.criar(dto, usuarioId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar portabilidade' })
  @ApiResponse({ status: 200, description: 'Portabilidade atualizada com sucesso' })
  @Roles('ADMIN', 'GESTOR', 'ANALISTA')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarPortabilidadeDTO,
    @Req() request: Request
  ) {
    const usuarioId = request['user'].id;
    return this.portabilidadeService.atualizar(id, dto, usuarioId);
  }

  @Post(':id/analise')
  @ApiOperation({ summary: 'Analisar portabilidade' })
  @ApiResponse({ status: 200, description: 'Portabilidade analisada com sucesso' })
  @Roles('ADMIN', 'GESTOR', 'ANALISTA')
  async analisar(
    @Param('id') id: string,
    @Body() dto: AnalisarPortabilidadeDTO,
    @Req() request: Request
  ) {
    const usuarioId = request['user'].id;
    return this.portabilidadeService.analisar(id, dto, usuarioId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar portabilidades' })
  @ApiResponse({ status: 200, description: 'Lista de portabilidades' })
  @Roles('ADMIN', 'GESTOR', 'ANALISTA', 'ATENDENTE')
  async listar(@Query() filtros: FiltrarPortabilidadeDTO) {
    return this.portabilidadeService.listar(filtros);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas de portabilidade' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  @Roles('ADMIN', 'GESTOR')
  async obterEstatisticas() {
    return this.portabilidadeService.obterEstatisticas();
  }
}
