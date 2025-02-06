import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/security/guards/roles.guard';
import { Roles } from '../infrastructure/security/decorators/roles.decorator';
import { Role } from '../domain/enums/role.enum';
import { IntegrationService } from '../services/integration.service';
import {
  ImportarFolhaDto,
  ConsultarMargemDto,
  AverbarContratoDto,
} from '../dtos/integration.dto';
import { LoggerService } from '../infrastructure/logger/logger.service';

@ApiTags('Integração')
@Controller('integration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly logger: LoggerService,
  ) {}

  @Post(':consignanteId/folha')
  @ApiOperation({ summary: 'Importa arquivo de folha de pagamento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ImportarFolhaDto })
  @Roles(Role.ADMIN, Role.CONSIGNANTE)
  @UseInterceptors(FileInterceptor('file'))
  async importarFolha(
    @Param('consignanteId', ParseIntPipe) consignanteId: number,
    @Body() dto: ImportarFolhaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(
      'Iniciando importação de folha',
      'IntegrationController',
      { consignanteId, competencia: dto.competencia }
    );

    const result = await this.integrationService.importarFolhaPagamento(
      consignanteId,
      dto.competencia,
      file.buffer,
    );

    if (!result.success) {
      this.logger.error(
        'Erro na importação de folha',
        result.error?.message,
        'IntegrationController',
        { consignanteId, competencia: dto.competencia }
      );
    }

    return result;
  }

  @Get(':consignanteId/margem/:matricula')
  @ApiOperation({ summary: 'Consulta margem consignável do servidor' })
  @Roles(Role.ADMIN, Role.CONSIGNATARIA, Role.CONSIGNANTE)
  async consultarMargem(
    @Param('consignanteId', ParseIntPipe) consignanteId: number,
    @Param('matricula') matricula: string,
  ) {
    this.logger.log(
      'Consultando margem',
      'IntegrationController',
      { consignanteId, matricula }
    );

    return this.integrationService.consultarMargem(consignanteId, matricula);
  }

  @Post(':consignanteId/averbar')
  @ApiOperation({ summary: 'Realiza averbação de contrato' })
  @Roles(Role.ADMIN, Role.CONSIGNATARIA)
  async averbarContrato(
    @Param('consignanteId', ParseIntPipe) consignanteId: number,
    @Body() dto: AverbarContratoDto,
  ) {
    this.logger.log(
      'Iniciando averbação',
      'IntegrationController',
      { consignanteId, contrato: dto.contrato }
    );

    return this.integrationService.averbarContrato(consignanteId, dto);
  }
}
