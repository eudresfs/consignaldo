import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsignanteDto {
  @ApiProperty({ description: 'Nome do consignante' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ description: 'Logo do consignante' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Nome do banco de dados' })
  @IsOptional()
  @IsString()
  bancoDados?: string;

  @ApiPropertyOptional({ description: 'URL do consignante' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'Tipo do consignante (E: Estado, C: Cidade, A: Autarquia)' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateConsignanteDto {
  @ApiPropertyOptional({ description: 'Nome do consignante' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Logo do consignante' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Nome do banco de dados' })
  @IsOptional()
  @IsString()
  bancoDados?: string;

  @ApiPropertyOptional({ description: 'URL do consignante' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'Tipo do consignante (E: Estado, C: Cidade, A: Autarquia)' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
