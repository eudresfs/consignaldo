import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsignatariaDto {
  @ApiProperty({ description: 'Nome da consignatária' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ description: 'Logo da consignatária' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateConsignatariaDto {
  @ApiPropertyOptional({ description: 'Nome da consignatária' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Logo da consignatária' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
