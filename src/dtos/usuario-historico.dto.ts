import { IsNumber, IsOptional, IsBoolean, IsString, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUsuarioHistoricoDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsNumber()
  usuarioId: number;

  @ApiProperty({ description: 'Dados do usuário serializados' })
  @IsString()
  usuarioSerializado: string;

  @ApiProperty({ description: 'Data da modificação' })
  @Type(() => Date)
  @IsDate()
  modifiedOn: Date;

  @ApiPropertyOptional({ description: 'ID do usuário que fez a modificação' })
  @IsOptional()
  @IsNumber()
  modifiedBy?: number;

  @ApiPropertyOptional({ description: 'Nome do usuário que fez a modificação' })
  @IsOptional()
  @IsString()
  modifiedByName?: string;

  @ApiPropertyOptional({ description: 'Tipo do usuário que fez a modificação' })
  @IsOptional()
  @IsString()
  modifiedByType?: string;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Ação realizada' })
  @IsOptional()
  @IsString()
  acao?: string;
}

export class UpdateUsuarioHistoricoDto {
  @ApiPropertyOptional({ description: 'Dados do usuário serializados' })
  @IsOptional()
  @IsString()
  usuarioSerializado?: string;

  @ApiPropertyOptional({ description: 'Data da modificação' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  modifiedOn?: Date;

  @ApiPropertyOptional({ description: 'ID do usuário que fez a modificação' })
  @IsOptional()
  @IsNumber()
  modifiedBy?: number;

  @ApiPropertyOptional({ description: 'Nome do usuário que fez a modificação' })
  @IsOptional()
  @IsString()
  modifiedByName?: string;

  @ApiPropertyOptional({ description: 'Tipo do usuário que fez a modificação' })
  @IsOptional()
  @IsString()
  modifiedByType?: string;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Ação realizada' })
  @IsOptional()
  @IsString()
  acao?: string;
}
