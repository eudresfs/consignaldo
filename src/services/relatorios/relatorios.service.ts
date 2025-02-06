import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RelatoriosRepository } from '../../repositories/relatorios.repository';
import { AuditoriaService } from '../auditoria.service';
import { StorageService } from '../storage.service';
import { CacheService } from '../cache.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { 
  TipoRelatorio, 
  FormatoRelatorio, 
  StatusRelatorio 
} from '../../domain/relatorios/relatorios.types';
import {
  CriarTemplateDTO,
  AtualizarTemplateDTO,
  GerarRelatorioDTO,
  ListarRelatoriosDTO
} from '../../dtos/relatorios/relatorios.dto';
import { ContratosGenerator } from './geradores/contratos.generator';
import { MargemGenerator } from './geradores/margem.generator';
import { Template, Relatorio } from '@prisma/client';

@Injectable()
export class RelatoriosService {
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(
    private repository: RelatoriosRepository,
    private auditoria: AuditoriaService,
    private storage: StorageService,
    private cache: CacheService,
    private prisma: PrismaService
  ) {}

  async criarTemplate(dto: CriarTemplateDTO, usuarioId: number): Promise<Template> {
    const template = await this.repository.criarTemplate(dto);
    
    await this.auditoria.registrar({
      entidade: 'Template',
      entidadeId: template.id,
      acao: 'CRIAR',
      usuarioId,
      dados: dto
    });

    return template;
  }

  async atualizarTemplate(id: string, dto: AtualizarTemplateDTO, usuarioId: number): Promise<Template> {
    const template = await this.repository.buscarTemplatePorId(id);
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    const templateAtualizado = await this.repository.atualizarTemplate(id, dto);
    
    await this.auditoria.registrar({
      entidade: 'Template',
      entidadeId: id,
      acao: 'ATUALIZAR',
      usuarioId,
      dados: dto
    });

    return templateAtualizado;
  }

  async listarTemplates(tipo?: TipoRelatorio): Promise<Template[]> {
    return this.repository.listarTemplates(tipo);
  }

  async gerarRelatorio(dto: GerarRelatorioDTO, usuarioId: number): Promise<Relatorio> {
    const template = await this.repository.buscarTemplatePorId(dto.templateId);
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    // Criar registro do relatório
    const relatorio = await this.repository.criarRelatorio(
      dto.templateId,
      template.tipo as TipoRelatorio,
      dto.formato,
      usuarioId,
      dto.filtros
    );

    // Iniciar geração assíncrona
    this.gerarRelatorioAsync(relatorio.id, template, dto.formato, dto.filtros, usuarioId)
      .catch(error => {
        console.error('Erro ao gerar relatório:', error);
        this.repository.atualizarStatusRelatorio(
          relatorio.id,
          StatusRelatorio.ERRO,
          undefined,
          [error.message]
        );
      });

    return relatorio;
  }

  private async gerarRelatorioAsync(
    relatorioId: string,
    template: Template,
    formato: FormatoRelatorio,
    filtros?: Record<string, any>,
    usuarioId?: number
  ): Promise<void> {
    await this.repository.atualizarStatusRelatorio(relatorioId, StatusRelatorio.PROCESSANDO);

    try {
      // Verificar cache
      const cacheKey = `relatorio:${template.tipo}:${formato}:${JSON.stringify(filtros)}`;
      const cachedUrl = await this.cache.get(cacheKey);
      
      if (cachedUrl) {
        await this.repository.atualizarStatusRelatorio(
          relatorioId,
          StatusRelatorio.CONCLUIDO,
          cachedUrl as string
        );
        return;
      }

      // Selecionar gerador apropriado
      const generator = this.selecionarGerador(template, formato, filtros);
      
      // Gerar arquivo
      const filePath = await generator.gerar();
      
      // Fazer upload para storage
      const url = await this.storage.upload(filePath, {
        pasta: 'relatorios',
        tipo: formato.toLowerCase(),
        nomePersonalizado: `${template.tipo.toLowerCase()}-${Date.now()}`
      });

      // Atualizar status e URL
      await this.repository.atualizarStatusRelatorio(
        relatorioId,
        StatusRelatorio.CONCLUIDO,
        url
      );

      // Salvar no cache
      await this.cache.set(cacheKey, url, this.CACHE_TTL);

      // Registrar auditoria
      if (usuarioId) {
        await this.auditoria.registrar({
          entidade: 'Relatorio',
          entidadeId: relatorioId,
          acao: 'GERAR',
          usuarioId,
          dados: { template: template.id, formato, filtros }
        });
      }

    } catch (error) {
      await this.repository.atualizarStatusRelatorio(
        relatorioId,
        StatusRelatorio.ERRO,
        undefined,
        [error.message]
      );
      throw error;
    }
  }

  private selecionarGerador(
    template: Template,
    formato: FormatoRelatorio,
    filtros?: Record<string, any>
  ) {
    switch (template.tipo as TipoRelatorio) {
      case TipoRelatorio.CONTRATOS:
        return new ContratosGenerator(template, formato, filtros, this.prisma);
      case TipoRelatorio.MARGEM:
        return new MargemGenerator(template, formato, filtros, this.prisma);
      // Adicionar outros geradores aqui
      default:
        throw new BadRequestException(`Tipo de relatório não suportado: ${template.tipo}`);
    }
  }

  async buscarRelatorio(id: string): Promise<Relatorio> {
    const relatorio = await this.repository.buscarRelatorioPorId(id);
    if (!relatorio) {
      throw new NotFoundException('Relatório não encontrado');
    }
    return relatorio;
  }

  async listarRelatorios(dto: ListarRelatoriosDTO): Promise<[Relatorio[], number]> {
    return this.repository.listarRelatorios(dto);
  }

  async removerRelatorio(id: string, usuarioId: number): Promise<void> {
    const relatorio = await this.repository.buscarRelatorioPorId(id);
    if (!relatorio) {
      throw new NotFoundException('Relatório não encontrado');
    }

    if (relatorio.arquivoUrl) {
      await this.storage.remover(relatorio.arquivoUrl);
    }

    await this.repository.removerRelatorio(id);

    await this.auditoria.registrar({
      entidade: 'Relatorio',
      entidadeId: id,
      acao: 'REMOVER',
      usuarioId
    });
  }
}
