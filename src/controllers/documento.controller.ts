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
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { DocumentoService } from '../services/documento.service';
import { 
  CriarDocumentoDTO,
  AtualizarDocumentoDTO,
  FiltrarDocumentosDTO,
  AnalisarDocumentoDTO 
} from '../dtos/documentos/documento.dto';
import { Request } from 'express';

@ApiTags('Documentos')
@Controller('documentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentoController {
  constructor(private readonly documentoService: DocumentoService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Fazer upload de documento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arquivo: {
          type: 'string',
          format: 'binary',
        },
        dados: {
          type: 'object',
          properties: CriarDocumentoDTO.prototype
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Documento criado com sucesso' })
  @UseInterceptors(FileInterceptor('arquivo'))
  async upload(
    @UploadedFile() arquivo: Express.Multer.File,
    @Body('dados') dados: string,
    @Req() request: Request
  ) {
    if (!arquivo) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const dto = JSON.parse(dados) as CriarDocumentoDTO;
    const usuarioId = request['user'].id;

    return this.documentoService.upload(
      arquivo.buffer,
      arquivo.originalname,
      arquivo.mimetype,
      dto,
      usuarioId
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  @ApiResponse({ status: 200, description: 'Documento atualizado com sucesso' })
  @Roles('ADMIN', 'GESTOR')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarDocumentoDTO,
    @Req() request: Request
  ) {
    const usuarioId = request['user'].id;
    return this.documentoService.atualizar(id, dto, usuarioId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar documento' })
  @ApiResponse({ status: 200, description: 'Documento deletado com sucesso' })
  @Roles('ADMIN', 'GESTOR')
  async deletar(
    @Param('id') id: string,
    @Req() request: Request
  ) {
    const usuarioId = request['user'].id;
    return this.documentoService.deletar(id, usuarioId);
  }

  @Post(':id/analise')
  @ApiOperation({ summary: 'Analisar documento' })
  @ApiResponse({ status: 200, description: 'Documento analisado com sucesso' })
  @Roles('ADMIN', 'GESTOR', 'ANALISTA')
  async analisar(
    @Param('id') id: string,
    @Body() dto: AnalisarDocumentoDTO,
    @Req() request: Request
  ) {
    const usuarioId = request['user'].id;
    return this.documentoService.analisar(id, dto, usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  @ApiResponse({ status: 200, description: 'Documento encontrado' })
  async buscarPorId(@Param('id') id: string) {
    return this.documentoService.buscarPorId(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  async listar(@Query() filtros: FiltrarDocumentosDTO) {
    return this.documentoService.listar(filtros);
  }

  @Get(':id/url-temporaria')
  @ApiOperation({ summary: 'Gerar URL temporária para download' })
  @ApiResponse({ status: 200, description: 'URL temporária gerada' })
  async gerarUrlTemporaria(@Param('id') id: string) {
    return this.documentoService.gerarUrlTemporaria(id);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas de documentos' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos documentos' })
  @Roles('ADMIN', 'GESTOR')
  async obterEstatisticas() {
    return this.documentoService.obterEstatisticas();
  }
}
