import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoAlerta, SeveridadeAlerta } from '../../domain/monitoramento/monitoramento.types';

export class CreateRegraAlertaDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty()
  @IsString()
  descricao: string;

  @ApiProperty({ enum: TipoAlerta })
  @IsEnum(TipoAlerta)
  tipo: TipoAlerta;

  @ApiProperty()
  @IsString()
  metricaNome: string;

  @ApiProperty({ enum: SeveridadeAlerta })
  @IsEnum(SeveridadeAlerta)
  severidade: SeveridadeAlerta;

  @ApiProperty()
  @IsString()
  condicao: string;

  @ApiProperty()
  @IsNumber()
  @Min(60)
  @Max(86400)
  intervalo: number;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  notificar: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class UpdateRegraAlertaDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ enum: TipoAlerta })
  @IsOptional()
  @IsEnum(TipoAlerta)
  tipo?: TipoAlerta;

  @ApiProperty()
  @IsOptional()
  @IsString()
  metricaNome?: string;

  @ApiProperty({ enum: SeveridadeAlerta })
  @IsOptional()
  @IsEnum(SeveridadeAlerta)
  severidade?: SeveridadeAlerta;

  @ApiProperty()
  @IsOptional()
  @IsString()
  condicao?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400)
  intervalo?: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificar?: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class QueryMetricasDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  inicio?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fim?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limite?: number;
}

export class QueryAlertasDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  regraId?: string;

  @ApiProperty({ required: false, enum: SeveridadeAlerta })
  @IsOptional()
  @IsEnum(SeveridadeAlerta)
  severidade?: SeveridadeAlerta;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  inicio?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fim?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limite?: number;
}
