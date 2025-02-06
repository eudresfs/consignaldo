import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { StatusConciliacao } from '../../domain/conciliacao/conciliacao.types';

export class IniciarConciliacaoDTO {
  @ApiProperty({ description: 'Data inicial para conciliação', required: false })
  @IsDateString()
  @IsOptional()
  dataInicial?: string;

  @ApiProperty({ description: 'Data final para conciliação', required: false })
  @IsDateString()
  @IsOptional()
  dataFinal?: string;

  @ApiProperty({ description: 'ID do banco para conciliação', required: false })
  @IsString()
  @IsOptional()
  bancoId?: string;
}

export class FiltrarConciliacoesDTO {
  @ApiProperty({ enum: StatusConciliacao, description: 'Status da conciliação' })
  @IsEnum(StatusConciliacao)
  @IsOptional()
  status?: StatusConciliacao;

  @ApiProperty({ description: 'Data inicial da consulta' })
  @IsDateString()
  @IsOptional()
  dataInicial?: string;

  @ApiProperty({ description: 'Data final da consulta' })
  @IsDateString()
  @IsOptional()
  dataFinal?: string;

  @ApiProperty({ description: 'ID do banco' })
  @IsString()
  @IsOptional()
  bancoId?: string;
}

export class ConsultarDivergenciasDTO {
  @ApiProperty({ description: 'ID da transação' })
  @IsUUID()
  transacaoId: string;
}
