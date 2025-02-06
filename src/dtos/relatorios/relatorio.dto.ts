import { IsEnum, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoRelatorio, FormatoRelatorio, StatusRelatorio } from '../../domain/relatorios/relatorio.types';

export class GerarRelatorioDTO {
  @ApiProperty({ enum: TipoRelatorio })
  @IsEnum(TipoRelatorio)
  tipo: TipoRelatorio;

  @ApiProperty({ enum: FormatoRelatorio })
  @IsEnum(FormatoRelatorio)
  formato: FormatoRelatorio;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  consignatariaId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  consignanteId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  status?: string;
}

export class FiltrarRelatoriosDTO {
  @ApiProperty({ enum: TipoRelatorio, required: false })
  @IsOptional()
  @IsEnum(TipoRelatorio)
  tipo?: TipoRelatorio;

  @ApiProperty({ enum: StatusRelatorio, required: false })
  @IsOptional()
  @IsEnum(StatusRelatorio)
  status?: StatusRelatorio;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
