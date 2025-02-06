import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsDateString,
  IsObject,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoIntegracao, StatusIntegracao } from '../../domain/api-publica/api-publica.types';

export class LimitesUsoDTO {
  @ApiProperty({ description: 'Limite de requisições por minuto', minimum: 1 })
  @IsNumber()
  @Min(1)
  requisicoesPorMinuto: number;

  @ApiProperty({ description: 'Limite de requisições por hora', minimum: 1 })
  @IsNumber()
  @Min(1)
  requisicoesPorHora: number;

  @ApiProperty({ description: 'Limite de requisições por dia', minimum: 1 })
  @IsNumber()
  @Min(1)
  requisicoesPorDia: number;

  @ApiProperty({ description: 'Limite de requisições concorrentes', minimum: 1 })
  @IsNumber()
  @Min(1)
  requisicoesConcorrentes: number;
}

export class CriarApiKeyDTO {
  @ApiProperty({ description: 'Nome da API Key' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'ID do cliente' })
  @IsString()
  clienteId: string;

  @ApiProperty({ description: 'Lista de permissões', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissoes: string[];

  @ApiProperty({ description: 'Limites de uso da API Key' })
  @ValidateNested()
  @Type(() => LimitesUsoDTO)
  limitesUso: LimitesUsoDTO;

  @ApiProperty({ description: 'Metadados adicionais', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AtualizarApiKeyDTO {
  @ApiProperty({ description: 'Nome da API Key', required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ description: 'Lista de permissões', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissoes?: string[];

  @ApiProperty({ description: 'Limites de uso da API Key', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitesUsoDTO)
  limitesUso?: LimitesUsoDTO;

  @ApiProperty({ description: 'Status da API Key', enum: StatusIntegracao, required: false })
  @IsOptional()
  @IsEnum(StatusIntegracao)
  status?: StatusIntegracao;

  @ApiProperty({ description: 'Metadados adicionais', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class WebhookConfigDTO {
  @ApiProperty({ description: 'URL do webhook' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Lista de eventos para notificação', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  eventos: string[];

  @ApiProperty({ description: 'Headers adicionais', required: false })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ description: 'Status do webhook' })
  @IsBoolean()
  ativo: boolean;

  @ApiProperty({ description: 'Número máximo de tentativas', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  tentativasMaximas: number;

  @ApiProperty({ description: 'Intervalos entre tentativas em segundos', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  intervalosRetentativa: number[];
}

export class FiltrosLogDTO {
  @ApiProperty({ description: 'ID da API Key', required: false })
  @IsOptional()
  @IsString()
  apiKeyId?: string;

  @ApiProperty({ description: 'Endpoint acessado', required: false })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiProperty({ description: 'Status code da resposta', required: false })
  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @ApiProperty({ description: 'Data início do período', required: false })
  @IsOptional()
  @IsDateString()
  dataInicio?: Date;

  @ApiProperty({ description: 'Data fim do período', required: false })
  @IsOptional()
  @IsDateString()
  dataFim?: Date;

  @ApiProperty({ description: 'IP do cliente', required: false })
  @IsOptional()
  @IsString()
  ip?: string;
}

export class PaginacaoDTO {
  @ApiProperty({ description: 'Número da página', minimum: 1, default: 1 })
  @IsNumber()
  @Min(1)
  pagina: number = 1;

  @ApiProperty({ description: 'Itens por página', minimum: 1, maximum: 100, default: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  itensPorPagina: number = 20;
}
