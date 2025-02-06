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
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RelatoriosService } from '../services/relatorios/relatorios.service';
import { 
  CriarTemplateDTO,
  AtualizarTemplateDTO,
  GerarRelatorioDTO,
  ListarRelatoriosDTO
} from '../dtos/relatorios/relatorios.dto';
import { TipoRelatorio } from '../domain/relatorios/relatorios.types';

@ApiTags('Relatórios')
@Controller('relatorios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Post('templates')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar template de relatório' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Template criado com sucesso' })
  async criarTemplate(@Body() dto: CriarTemplateDTO, @Request() req) {
    return this.service.criarTemplate(dto, req.user.id);
  }

  @Put('templates/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar template de relatório' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template atualizado com sucesso' })
  async atualizarTemplate(
    @Param('id') id: string,
    @Body() dto: AtualizarTemplateDTO,
    @Request() req
  ) {
    return this.service.atualizarTemplate(id, dto, req.user.id);
  }

  @Get('templates')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Listar templates de relatório' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de templates' })
  async listarTemplates(@Query('tipo') tipo?: TipoRelatorio) {
    return this.service.listarTemplates(tipo);
  }

  @Post('gerar')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Gerar relatório' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Relatório em geração' })
  async gerarRelatorio(@Body() dto: GerarRelatorioDTO, @Request() req) {
    return this.service.gerarRelatorio(dto, req.user.id);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Buscar relatório por ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relatório encontrado' })
  async buscarRelatorio(@Param('id') id: string) {
    return this.service.buscarRelatorio(id);
  }

  @Get()
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Listar relatórios' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de relatórios' })
  async listarRelatorios(@Query() dto: ListarRelatoriosDTO) {
    const [items, total] = await this.service.listarRelatorios(dto);
    return {
      items,
      total,
      pagina: dto.pagina,
      itensPorPagina: dto.itensPorPagina
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover relatório' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Relatório removido' })
  async removerRelatorio(@Param('id') id: string, @Request() req) {
    await this.service.removerRelatorio(id, req.user.id);
  }
}
