import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { Template, Relatorio } from '@prisma/client';
import { TipoRelatorio, FormatoRelatorio, StatusRelatorio } from '../domain/relatorios/relatorios.types';
import { CriarTemplateDTO, AtualizarTemplateDTO, ListarRelatoriosDTO } from '../dtos/relatorios/relatorios.dto';

@Injectable()
export class RelatoriosRepository {
  constructor(private prisma: PrismaService) {}

  async criarTemplate(dto: CriarTemplateDTO): Promise<Template> {
    return this.prisma.template.create({
      data: {
        nome: dto.nome,
        tipo: dto.tipo,
        formato: dto.formato,
        layout: dto.layout,
        cabecalho: dto.cabecalho,
        rodape: dto.rodape,
        estilos: dto.estilos,
        metadata: dto.metadata
      }
    });
  }

  async atualizarTemplate(id: string, dto: AtualizarTemplateDTO): Promise<Template> {
    return this.prisma.template.update({
      where: { id },
      data: {
        nome: dto.nome,
        tipo: dto.tipo,
        formato: dto.formato,
        layout: dto.layout,
        cabecalho: dto.cabecalho,
        rodape: dto.rodape,
        estilos: dto.estilos,
        metadata: dto.metadata
      }
    });
  }

  async buscarTemplatePorId(id: string): Promise<Template | null> {
    return this.prisma.template.findUnique({
      where: { id }
    });
  }

  async listarTemplates(tipo?: TipoRelatorio): Promise<Template[]> {
    return this.prisma.template.findMany({
      where: tipo ? { tipo } : undefined,
      orderBy: { nome: 'asc' }
    });
  }

  async removerTemplate(id: string): Promise<void> {
    await this.prisma.template.delete({
      where: { id }
    });
  }

  async criarRelatorio(
    templateId: string,
    tipo: TipoRelatorio,
    formato: FormatoRelatorio,
    usuarioId: number,
    filtros?: Record<string, any>
  ): Promise<Relatorio> {
    return this.prisma.relatorio.create({
      data: {
        templateId,
        tipo,
        formato,
        status: StatusRelatorio.AGUARDANDO,
        filtros,
        usuarioId
      }
    });
  }

  async atualizarStatusRelatorio(
    id: string,
    status: StatusRelatorio,
    arquivoUrl?: string,
    erros?: string[]
  ): Promise<Relatorio> {
    return this.prisma.relatorio.update({
      where: { id },
      data: {
        status,
        arquivoUrl,
        erros: erros ? { set: erros } : undefined,
        atualizadoEm: new Date()
      }
    });
  }

  async buscarRelatorioPorId(id: string): Promise<Relatorio | null> {
    return this.prisma.relatorio.findUnique({
      where: { id },
      include: {
        template: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
  }

  async listarRelatorios(dto: ListarRelatoriosDTO): Promise<[Relatorio[], number]> {
    const where = {
      ...(dto.tipo && { tipo: dto.tipo }),
      ...(dto.dataInicio && dto.dataFim && {
        criadoEm: {
          gte: new Date(dto.dataInicio),
          lte: new Date(dto.dataFim)
        }
      })
    };

    const [relatorios, total] = await Promise.all([
      this.prisma.relatorio.findMany({
        where,
        include: {
          template: true,
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        skip: (dto.pagina - 1) * dto.itensPorPagina,
        take: dto.itensPorPagina,
        orderBy: { criadoEm: 'desc' }
      }),
      this.prisma.relatorio.count({ where })
    ]);

    return [relatorios, total];
  }

  async removerRelatorio(id: string): Promise<void> {
    await this.prisma.relatorio.delete({
      where: { id }
    });
  }
}
