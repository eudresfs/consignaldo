import { IsDate, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { AverbacaoStatus } from '../domain/averbacao.entity';

export class CreateAverbacaoDto {
  @IsDate()
  dataAverbacao: Date;

  @IsEnum(AverbacaoStatus)
  status: AverbacaoStatus;

  @IsNumber()
  valorTotal: number;

  @IsBoolean()
  ativo: boolean = true;
} 