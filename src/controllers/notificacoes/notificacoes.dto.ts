import { IsString, IsEnum, IsOptional, IsDate, IsNumber, IsBoolean, IsObject, IsUUID, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TipoNotificacao, PrioridadeNotificacao, StatusTemplate } from '../../domain/notificacoes/notificacoes.types';

export class CriarNotificacaoDto {
  @ApiProperty({ enum: TipoNotificacao })
  @IsEnum(TipoNotificacao)
  tipo: TipoNotificacao;

  @ApiProperty({ enum: PrioridadeNotificacao })
  @IsEnum(PrioridadeNotificacao)
  prioridade: PrioridadeNotificacao;

  @ApiProperty()
  @IsString()
  destinatario: string;

  @ApiProperty()
  @IsString()
  titulo: string;

  @ApiProperty()
  @IsString()
  conteudo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  agendadoPara?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  dados?: Record<string, any>;
}

export class CriarTemplateDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty()
  @IsString()
  descricao: string;

  @ApiProperty({ enum: TipoNotificacao })
  @IsEnum(TipoNotificacao)
  tipo: TipoNotificacao;

  @ApiProperty()
  @IsString()
  assunto: string;

  @ApiProperty()
  @IsString()
  conteudo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  dados?: Record<string, any>;
}

export class AtualizarTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assunto?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  conteudo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  dados?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(StatusTemplate)
  status?: StatusTemplate;
}

export class CriarWebhookDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  segredo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(TipoNotificacao, { each: true })
  tipos?: TipoNotificacao[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}

export class AtualizarWebhookDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  segredo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(TipoNotificacao, { each: true })
  tipos?: TipoNotificacao[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class CriarAgendamentoDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty()
  @IsString()
  descricao: string;

  @ApiProperty()
  @IsString()
  expressaoCron: string;

  @ApiProperty({ enum: TipoNotificacao })
  @IsEnum(TipoNotificacao)
  tipo: TipoNotificacao;

  @ApiProperty()
  @IsString()
  destinatario: string;

  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  dados?: Record<string, any>;
}

export class AtualizarAgendamentoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expressaoCron?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  destinatario?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  dados?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class ListarNotificacoesQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(TipoNotificacao)
  tipo?: TipoNotificacao;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  inicio?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fim?: Date;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limite?: number = 10;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class ListarTemplatesQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(TipoNotificacao)
  tipo?: TipoNotificacao;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(StatusTemplate)
  status?: StatusTemplate;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limite?: number = 10;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class ResolverNotificacaoDto {
  @ApiProperty()
  @IsString()
  observacao: string;
}
