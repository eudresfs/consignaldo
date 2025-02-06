import { IsString, IsNumber, IsDate, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImportarFolhaDto {
  @ApiProperty({ description: 'Competência no formato YYYY-MM' })
  @IsString()
  competencia: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Arquivo da folha de pagamento' })
  file: Express.Multer.File;
}

export class ConsultarMargemDto {
  @ApiProperty({ description: 'Matrícula do servidor' })
  @IsString()
  matricula: string;
}

export class AverbarContratoDto {
  @ApiProperty({ description: 'Matrícula do servidor' })
  @IsString()
  matricula: string;

  @ApiProperty({ description: 'Número do contrato' })
  @IsString()
  contrato: string;

  @ApiProperty({ description: 'Valor da parcela' })
  @IsNumber()
  @Min(0)
  parcela: number;

  @ApiProperty({ description: 'Prazo em meses' })
  @IsNumber()
  @Min(1)
  prazo: number;

  @ApiProperty({ description: 'Data de início do contrato' })
  @Type(() => Date)
  @IsDate()
  dataInicio: Date;

  @ApiProperty({ description: 'Código do banco' })
  @IsString()
  banco: string;

  @ApiProperty({ description: 'Situação do contrato' })
  @IsString()
  @IsOptional()
  situacao?: string;
}
