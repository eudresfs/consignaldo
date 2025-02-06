import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHmac } from 'crypto';
import { ApiPublicaRepository } from '../repositories/api-publica.repository';
import { AuditoriaService } from './auditoria.service';
import {
  ApiKey,
  WebhookConfig,
  LogIntegracao,
  MetricasUso,
  StatusIntegracao
} from '../domain/api-publica/api-publica.types';
import {
  CriarApiKeyDTO,
  AtualizarApiKeyDTO,
  WebhookConfigDTO,
  FiltrosLogDTO,
  PaginacaoDTO
} from '../dtos/api-publica/api-publica.dto';

@Injectable()
export class ApiPublicaService {
  constructor(
    private readonly repository: ApiPublicaRepository,
    private readonly auditoriaService: AuditoriaService,
    private readonly configService: ConfigService
  ) {}

  private gerarApiKey(): string {
    const bytes = randomBytes(32);
    const hmac = createHmac('sha256', this.configService.get('API_KEY_SECRET'));
    hmac.update(bytes);
    return hmac.digest('hex');
  }

  private validarLimitesUso(apiKey: ApiKey): void {
    const agora = new Date();
    const umMinutoAtras = new Date(agora.getTime() - 60000);
    const umaHoraAtras = new Date(agora.getTime() - 3600000);
    const umDiaAtras = new Date(agora.getTime() - 86400000);

    // Implementar lógica de rate limiting usando Redis
    // TODO: Integrar com Redis para controle de rate limiting distribuído
  }

  async criarApiKey(dto: CriarApiKeyDTO, usuarioId: number): Promise<ApiKey> {
    const chave = this.gerarApiKey();

    const apiKey = await this.repository.criarApiKey({
      chave,
      nome: dto.nome,
      clienteId: dto.clienteId,
      permissoes: dto.permissoes,
      limitesUso: dto.limitesUso,
      status: StatusIntegracao.ATIVO,
      metadata: dto.metadata
    });

    await this.auditoriaService.registrar({
      entidade: 'ApiKey',
      entidadeId: apiKey.id,
      acao: 'CRIAR',
      usuarioId,
      dados: { ...dto, chave: '***' }
    });

    return apiKey;
  }

  async atualizarApiKey(
    id: string,
    dto: AtualizarApiKeyDTO,
    usuarioId: number
  ): Promise<ApiKey> {
    const apiKey = await this.repository.buscarApiKeyPorId(id);
    if (!apiKey) {
      throw new NotFoundException('API Key não encontrada');
    }

    const apiKeyAtualizada = await this.repository.atualizarApiKey(id, {
      nome: dto.nome,
      permissoes: dto.permissoes,
      limitesUso: dto.limitesUso,
      status: dto.status,
      metadata: dto.metadata
    });

    await this.auditoriaService.registrar({
      entidade: 'ApiKey',
      entidadeId: id,
      acao: 'ATUALIZAR',
      usuarioId,
      dados: dto
    });

    return apiKeyAtualizada;
  }

  async validarApiKey(chave: string): Promise<ApiKey> {
    const apiKey = await this.repository.buscarApiKeyPorChave(chave);
    if (!apiKey) {
      throw new UnauthorizedException('API Key inválida');
    }

    if (apiKey.status !== StatusIntegracao.ATIVO) {
      throw new UnauthorizedException('API Key inativa ou suspensa');
    }

    this.validarLimitesUso(apiKey);

    return apiKey;
  }

  async configurarWebhook(
    apiKeyId: string,
    dto: WebhookConfigDTO,
    usuarioId: number
  ): Promise<WebhookConfig> {
    const apiKey = await this.repository.buscarApiKeyPorId(apiKeyId);
    if (!apiKey) {
      throw new NotFoundException('API Key não encontrada');
    }

    const webhook = await this.repository.criarWebhook(apiKeyId, {
      url: dto.url,
      eventos: dto.eventos,
      headers: dto.headers,
      ativo: dto.ativo,
      tentativasMaximas: dto.tentativasMaximas,
      intervalosRetentativa: dto.intervalosRetentativa
    });

    await this.auditoriaService.registrar({
      entidade: 'Webhook',
      entidadeId: webhook.id,
      acao: 'CRIAR',
      usuarioId,
      dados: dto
    });

    return webhook;
  }

  async atualizarWebhook(
    id: string,
    dto: Partial<WebhookConfigDTO>,
    usuarioId: number
  ): Promise<WebhookConfig> {
    const webhook = await this.repository.atualizarWebhook(id, dto);

    await this.auditoriaService.registrar({
      entidade: 'Webhook',
      entidadeId: id,
      acao: 'ATUALIZAR',
      usuarioId,
      dados: dto
    });

    return webhook;
  }

  async removerWebhook(id: string, usuarioId: number): Promise<void> {
    await this.repository.removerWebhook(id);

    await this.auditoriaService.registrar({
      entidade: 'Webhook',
      entidadeId: id,
      acao: 'REMOVER',
      usuarioId
    });
  }

  async registrarLog(dados: Omit<LogIntegracao, 'id'>): Promise<LogIntegracao> {
    return this.repository.registrarLog(dados);
  }

  async buscarLogs(
    filtros: FiltrosLogDTO,
    paginacao: PaginacaoDTO
  ): Promise<{ items: LogIntegracao[]; total: number }> {
    return this.repository.buscarLogs(filtros, paginacao);
  }

  async obterMetricas(apiKeyId: string, periodo: string): Promise<MetricasUso> {
    const periodos = ['hora', 'dia', 'semana', 'mes'];
    if (!periodos.includes(periodo)) {
      throw new BadRequestException('Período inválido');
    }

    return this.repository.obterMetricas(apiKeyId, periodo);
  }

  async listarApiKeys(
    paginacao: PaginacaoDTO
  ): Promise<{ items: ApiKey[]; total: number }> {
    return this.repository.listarApiKeys(paginacao);
  }
}
