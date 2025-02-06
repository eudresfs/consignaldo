import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AuditoriaService } from '../services/auditoria.service';
import { FiltrarAuditoriaDTO } from '../dtos/auditoria/auditoria.dto';
import { Request } from 'express';

@ApiTags('Auditoria')
@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'AUDITOR') // Apenas administradores e auditores podem acessar
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar registro de auditoria por ID' })
  @ApiResponse({ status: 200, description: 'Registro de auditoria encontrado' })
  async buscarPorId(@Param('id') id: string) {
    return this.auditoriaService.buscarPorId(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros de auditoria' })
  @ApiResponse({ status: 200, description: 'Lista de registros de auditoria' })
  async listarRegistros(@Query() filtros: FiltrarAuditoriaDTO, @Req() request: Request) {
    return this.auditoriaService.listarRegistros(filtros);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas de auditoria' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos registros de auditoria' })
  async obterEstatisticas() {
    return this.auditoriaService.obterEstatisticas();
  }
}
