import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsDate, Min, Max, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { StatusPortabilidade, TipoRecusa } from '../../domain/portabilidade/portabilidade.types';

export class SimularPortabilidadeDTO {
  @ApiProperty()
  @IsUUID()
  contratoOrigemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  valorSaldoDevedor: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  valorParcela: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxaJurosAtual: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  prazoRestante: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  prazoTotal: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  parcelasPagas: number;
}

export class CriarPortabilidadeDTO {
  @ApiProperty()
  @IsUUID()
  contratoOrigemId: string;

  @ApiProperty()
  @IsNumber()
  bancoOrigemId: number;

  @ApiProperty()
  @IsNumber()
  bancoDestinoId: number;

  @ApiProperty()
  @IsNumber()
  servidorId: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  valorSaldoDevedor: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  valorParcela: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxaJurosAtual: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxaJurosNova: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  prazoRestante: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  prazoTotal: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  parcelasPagas: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentos?: string[];
}

export class AtualizarPortabilidadeDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorSaldoDevedor?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorParcela?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxaJurosNova?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentos?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  protocoloBanco?: string;
}

export class AnalisarPortabilidadeDTO {
  @ApiProperty()
  @IsEnum(StatusPortabilidade)
  status: StatusPortabilidade;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(TipoRecusa)
  motivoRecusa?: TipoRecusa;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class FiltrarPortabilidadeDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(StatusPortabilidade)
  status?: StatusPortabilidade;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bancoOrigemId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bancoDestinoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  servidorId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicial?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFinal?: Date;
}
