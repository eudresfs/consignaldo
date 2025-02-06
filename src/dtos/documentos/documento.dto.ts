import { 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsArray, 
  IsDateString,
  IsUrl,
  MaxLength,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { 
  TipoDocumento,
  StatusDocumento,
  TipoArmazenamento 
} from '../../domain/documentos/documento.types';

export class CriarDocumentoDTO {
  @ApiProperty({ enum: TipoDocumento })
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  nome: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  tamanho: number;

  @ApiProperty()
  @IsString()
  hash: string;

  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  urlTemp?: string;

  @ApiProperty({ enum: TipoArmazenamento })
  @IsEnum(TipoArmazenamento)
  tipoArmazenamento: TipoArmazenamento;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: {
    versao?: string;
    origem?: string;
    validadeInicio?: Date;
    validadeFim?: Date;
    numeroDocumento?: string;
    orgaoEmissor?: string;
    dataEmissao?: Date;
    observacoes?: string;
    tags?: string[];
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeTipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataExpiracao?: string;
}

export class AtualizarDocumentoDTO {
  @ApiProperty({ enum: TipoDocumento, required: false })
  @IsOptional()
  @IsEnum(TipoDocumento)
  tipo?: TipoDocumento;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  urlTemp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: {
    versao?: string;
    origem?: string;
    validadeInicio?: Date;
    validadeFim?: Date;
    numeroDocumento?: string;
    orgaoEmissor?: string;
    dataEmissao?: Date;
    observacoes?: string;
    tags?: string[];
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataExpiracao?: string;
}

export class FiltrarDocumentosDTO {
  @ApiProperty({ enum: TipoDocumento, required: false })
  @IsOptional()
  @IsEnum(TipoDocumento)
  tipo?: TipoDocumento;

  @ApiProperty({ enum: StatusDocumento, required: false })
  @IsOptional()
  @IsEnum(StatusDocumento)
  status?: StatusDocumento;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadeTipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AnalisarDocumentoDTO {
  @ApiProperty({ enum: StatusDocumento })
  @IsEnum(StatusDocumento)
  status: StatusDocumento;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}
