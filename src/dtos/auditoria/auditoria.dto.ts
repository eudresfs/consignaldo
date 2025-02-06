import { IsEnum, IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoAuditoria, TipoOperacao, NivelCriticidade } from '../../domain/auditoria/auditoria.types';

export class FiltrarAuditoriaDTO {
  @ApiProperty({ enum: TipoAuditoria, required: false })
  @IsOptional()
  @IsEnum(TipoAuditoria)
  tipo?: TipoAuditoria;

  @ApiProperty({ enum: TipoOperacao, required: false })
  @IsOptional()
  @IsEnum(TipoOperacao)
  operacao?: TipoOperacao;

  @ApiProperty({ enum: NivelCriticidade, required: false })
  @IsOptional()
  @IsEnum(NivelCriticidade)
  criticidade?: NivelCriticidade;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeTipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}

export class RegistrarAuditoriaDTO {
  @ApiProperty({ enum: TipoAuditoria })
  @IsEnum(TipoAuditoria)
  tipo: TipoAuditoria;

  @ApiProperty({ enum: TipoOperacao })
  @IsEnum(TipoOperacao)
  operacao: TipoOperacao;

  @ApiProperty({ enum: NivelCriticidade })
  @IsEnum(NivelCriticidade)
  criticidade: NivelCriticidade;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeTipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  dadosAnteriores?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  dadosNovos?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}
