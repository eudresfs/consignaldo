import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsArray, 
  IsDate,
  Min,
  Max,
  IsPositive
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusRefinanciamento, TipoRecusaRefinanciamento } from '../../domain/refinanciamento/refinanciamento.types';

export class SimularRefinanciamentoDTO {
  @ApiProperty()
  @IsString()
  contratoId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  valorContrato: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  valorParcela: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(10)
  taxaJuros: number;

  @ApiProperty()
  @IsNumber()
  @Min(12)
  @Max(96)
  prazoTotal: number;

  @ApiProperty()
  @IsNumber()
  @Min(6)
  parcelasPagas: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  saldoDevedor: number;
}

export class CriarRefinanciamentoDTO {
  @ApiProperty()
  @IsString()
  contratoId: string;

  @ApiProperty()
  @IsNumber()
  bancoId: number;

  @ApiProperty()
  @IsNumber()
  servidorId: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  valorContrato: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  valorParcela: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(10)
  taxaJurosAtual: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(10)
  taxaJurosNova: number;

  @ApiProperty()
  @IsNumber()
  @Min(12)
  @Max(96)
  prazoTotal: number;

  @ApiProperty()
  @IsNumber()
  @Min(6)
  parcelasPagas: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  saldoDevedor: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  documentos: string[];
}

export class AtualizarRefinanciamentoDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentos?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class AnalisarRefinanciamentoDTO {
  @ApiProperty()
  @IsEnum(StatusRefinanciamento)
  status: StatusRefinanciamento;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(TipoRecusaRefinanciamento)
  motivoRecusa?: TipoRecusaRefinanciamento;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class ListarRefinanciamentosDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(StatusRefinanciamento)
  status?: StatusRefinanciamento;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bancoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  servidorId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorMinimo?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorMaximo?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;
}
