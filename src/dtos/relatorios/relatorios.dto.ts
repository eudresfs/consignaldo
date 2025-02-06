import { IsString, IsEnum, IsOptional, IsObject, ValidateNested, IsInt, Min, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TipoRelatorio, FormatoRelatorio } from '../../domain/relatorios/relatorios.types';
import { PaginacaoDTO } from '../comum/paginacao.dto';

export class CriarTemplateDTO {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty({ enum: TipoRelatorio })
  @IsEnum(TipoRelatorio)
  tipo: TipoRelatorio;

  @ApiProperty({ enum: FormatoRelatorio })
  @IsEnum(FormatoRelatorio)
  formato: FormatoRelatorio;

  @ApiProperty()
  @IsString()
  layout: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cabecalho?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rodape?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  estilos?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AtualizarTemplateDTO extends CriarTemplateDTO {}

export class GerarRelatorioDTO {
  @ApiProperty()
  @IsString()
  templateId: string;

  @ApiProperty({ enum: FormatoRelatorio })
  @IsEnum(FormatoRelatorio)
  formato: FormatoRelatorio;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  filtros?: Record<string, any>;
}

export class FiltrosContratoDTO {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  banco?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  valorMinimo?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  valorMaximo?: number;
}

export class FiltrosMargemDTO {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  orgao?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  margemMinimaDisponivel?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  quantidadeMinimaContratos?: number;
}

export class FiltrosConsignacaoDTO {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  competencia?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataProcessamentoInicio?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataProcessamentoFim?: string;
}

export class FiltrosPerformanceDTO {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  endpoints?: string[];
}

export class ListarRelatoriosDTO extends PaginacaoDTO {
  @ApiProperty({ required: false })
  @IsEnum(TipoRelatorio)
  @IsOptional()
  tipo?: TipoRelatorio;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataFim?: string;
}
