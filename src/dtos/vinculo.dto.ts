import { IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVinculoDto {
  @ApiProperty({ description: 'ID da consignatária' })
  @IsNumber()
  consignatariaId: number;

  @ApiProperty({ description: 'ID do consignante' })
  @IsNumber()
  consignanteId: number;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateVinculoDto {
  @ApiPropertyOptional({ description: 'ID da consignatária' })
  @IsOptional()
  @IsNumber()
  consignatariaId?: number;

  @ApiPropertyOptional({ description: 'ID do consignante' })
  @IsOptional()
  @IsNumber()
  consignanteId?: number;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
