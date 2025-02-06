import { IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsuarioVinculoDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsNumber()
  usuarioId: number;

  @ApiProperty({ description: 'ID do vínculo' })
  @IsNumber()
  vinculoId: number;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateUsuarioVinculoDto {
  @ApiPropertyOptional({ description: 'ID do usuário' })
  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @ApiPropertyOptional({ description: 'ID do vínculo' })
  @IsOptional()
  @IsNumber()
  vinculoId?: number;

  @ApiPropertyOptional({ description: 'Status de ativação' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
