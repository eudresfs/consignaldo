import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';
import { RelatorioService } from '../services/relatorio.service';
import { GerarRelatorioDTO, FiltrarRelatoriosDTO } from '../dtos/relatorios/relatorio.dto';
import { Usuario } from '../decorators/usuario.decorator';

@ApiTags('Relatórios')
@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  @Post()
  @ApiOperation({ summary: 'Gerar novo relatório' })
  @ApiResponse({ status: 201, description: 'Relatório enfileirado para geração' })
  async gerarRelatorio(
    @Body() dto: GerarRelatorioDTO,
    @Usuario('id') usuarioId: number
  ) {
    return this.relatorioService.gerarRelatorio(dto, usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar status do relatório' })
  @ApiResponse({ status: 200, description: 'Status do relatório' })
  async consultarStatus(@Param('id') id: string) {
    return this.relatorioService.consultarStatus(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar relatórios' })
  @ApiResponse({ status: 200, description: 'Lista de relatórios' })
  async listarRelatorios(@Query() filtros: FiltrarRelatoriosDTO) {
    return this.relatorioService.listarRelatorios(filtros);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas de relatórios' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos relatórios' })
  async obterEstatisticas() {
    return this.relatorioService.obterEstatisticas();
  }
}
