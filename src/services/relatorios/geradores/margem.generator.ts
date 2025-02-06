import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RelatorioGenerator } from './base.generator';
import { RelatorioMargem } from '../../../domain/relatorios/relatorios.types';
import { FiltrosMargemDTO } from '../../../dtos/relatorios/relatorios.dto';
import { FormatoRelatorio } from '../../../domain/relatorios/relatorios.types';
import { Template } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as PDFKit from 'pdfkit';

@Injectable()
export class MargemGenerator extends RelatorioGenerator<RelatorioMargem> {
  constructor(
    template: Template,
    formato: FormatoRelatorio,
    filtros: FiltrosMargemDTO,
    private prisma: PrismaService
  ) {
    super(template, formato, filtros);
  }

  async buscarDados(): Promise<RelatorioMargem[]> {
    const { orgao, margemMinimaDisponivel, quantidadeMinimaContratos } = this.filtros as FiltrosMargemDTO;

    const servidores = await this.prisma.servidor.findMany({
      where: {
        ...(orgao && { orgaoId: orgao }),
        ...(margemMinimaDisponivel && {
          margemDisponivel: { gte: margemMinimaDisponivel }
        }),
        ...(quantidadeMinimaContratos && {
          contratos: {
            some: {},
            _count: { gte: quantidadeMinimaContratos }
          }
        })
      },
      include: {
        orgao: {
          select: {
            nome: true
          }
        },
        _count: {
          select: { contratos: true }
        }
      }
    });

    return servidores.map(servidor => ({
      id: servidor.id,
      servidor: servidor.nome,
      orgao: servidor.orgao.nome,
      margemTotal: servidor.margemTotal,
      margemUsada: servidor.margemUsada,
      margemDisponivel: servidor.margemDisponivel,
      quantidadeContratos: servidor._count.contratos,
      dataAtualizacao: servidor.atualizadoEm
    }));
  }

  async processarDados(dados: RelatorioMargem[]): Promise<any> {
    const totalServidores = dados.length;
    const margemTotalGeral = dados.reduce((sum, item) => sum + item.margemTotal, 0);
    const margemUsadaGeral = dados.reduce((sum, item) => sum + item.margemUsada, 0);
    const margemDisponivelGeral = dados.reduce((sum, item) => sum + item.margemDisponivel, 0);
    const totalContratos = dados.reduce((sum, item) => sum + item.quantidadeContratos, 0);

    const porOrgao = dados.reduce((acc, item) => {
      if (!acc[item.orgao]) {
        acc[item.orgao] = {
          servidores: 0,
          margemTotal: 0,
          margemUsada: 0,
          margemDisponivel: 0,
          contratos: 0
        };
      }
      acc[item.orgao].servidores++;
      acc[item.orgao].margemTotal += item.margemTotal;
      acc[item.orgao].margemUsada += item.margemUsada;
      acc[item.orgao].margemDisponivel += item.margemDisponivel;
      acc[item.orgao].contratos += item.quantidadeContratos;
      return acc;
    }, {} as Record<string, any>);

    return {
      servidores: dados,
      resumo: {
        totalServidores,
        margemTotalGeral: this.formatarMoeda(margemTotalGeral),
        margemUsadaGeral: this.formatarMoeda(margemUsadaGeral),
        margemDisponivelGeral: this.formatarMoeda(margemDisponivelGeral),
        totalContratos,
        porOrgao
      }
    };
  }

  async gerarArquivo(dados: any): Promise<string> {
    switch (this.formato) {
      case FormatoRelatorio.PDF:
        return this.gerarPDF(dados);
      case FormatoRelatorio.EXCEL:
        return this.gerarExcel(dados);
      case FormatoRelatorio.CSV:
        return this.gerarCSV(dados);
      default:
        throw new Error(`Formato não suportado: ${this.formato}`);
    }
  }

  private async gerarPDF(dados: any): Promise<string> {
    const doc = new PDFKit();
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        const filePath = `/tmp/margem-${Date.now()}.pdf`;
        require('fs').writeFileSync(filePath, result);
        resolve(filePath);
      });
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(16).text('Relatório de Margem Consignável', { align: 'center' });
      doc.moveDown();

      // Resumo Geral
      doc.fontSize(12).text('Resumo Geral', { underline: true });
      doc.fontSize(10)
        .text(`Total de Servidores: ${dados.resumo.totalServidores}`)
        .text(`Margem Total: ${dados.resumo.margemTotalGeral}`)
        .text(`Margem Usada: ${dados.resumo.margemUsadaGeral}`)
        .text(`Margem Disponível: ${dados.resumo.margemDisponivelGeral}`)
        .text(`Total de Contratos: ${dados.resumo.totalContratos}`);
      doc.moveDown();

      // Resumo por Órgão
      doc.fontSize(12).text('Resumo por Órgão', { underline: true });
      Object.entries(dados.resumo.porOrgao).forEach(([orgao, info]: [string, any]) => {
        doc.fontSize(10)
          .text(`${orgao}:`)
          .text(`  Servidores: ${info.servidores}`)
          .text(`  Margem Total: ${this.formatarMoeda(info.margemTotal)}`)
          .text(`  Margem Disponível: ${this.formatarMoeda(info.margemDisponivel)}`)
          .text(`  Contratos: ${info.contratos}`);
        doc.moveDown();
      });

      // Detalhamento
      doc.addPage();
      doc.fontSize(12).text('Detalhamento por Servidor', { underline: true });
      doc.moveDown();

      // Tabela
      const table = {
        headers: ['Servidor', 'Órgão', 'Margem Total', 'Margem Usada', 'Margem Disponível', 'Contratos'],
        rows: dados.servidores.map((item: RelatorioMargem) => [
          item.servidor,
          item.orgao,
          this.formatarMoeda(item.margemTotal),
          this.formatarMoeda(item.margemUsada),
          this.formatarMoeda(item.margemDisponivel),
          item.quantidadeContratos
        ])
      };

      let y = doc.y;
      const rowHeight = 20;
      const colWidths = [120, 100, 80, 80, 80, 60];

      // Headers
      table.headers.forEach((header, i) => {
        doc.text(header, doc.x + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
      });

      y += rowHeight;

      // Rows
      table.rows.forEach(row => {
        row.forEach((cell, i) => {
          doc.text(String(cell), doc.x + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
        });
        y += rowHeight;

        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      doc.end();
    });
  }

  private async gerarExcel(dados: any): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    
    // Aba de Resumo
    const resumoSheet = workbook.addWorksheet('Resumo');
    resumoSheet.addRow(['Resumo Geral']);
    resumoSheet.addRow(['Total de Servidores', dados.resumo.totalServidores]);
    resumoSheet.addRow(['Margem Total', dados.resumo.margemTotalGeral]);
    resumoSheet.addRow(['Margem Usada', dados.resumo.margemUsadaGeral]);
    resumoSheet.addRow(['Margem Disponível', dados.resumo.margemDisponivelGeral]);
    resumoSheet.addRow(['Total de Contratos', dados.resumo.totalContratos]);

    resumoSheet.addRow([]);
    resumoSheet.addRow(['Resumo por Órgão']);
    Object.entries(dados.resumo.porOrgao).forEach(([orgao, info]: [string, any]) => {
      resumoSheet.addRow([
        orgao,
        `Servidores: ${info.servidores}`,
        `Margem Total: ${this.formatarMoeda(info.margemTotal)}`,
        `Margem Disponível: ${this.formatarMoeda(info.margemDisponivel)}`,
        `Contratos: ${info.contratos}`
      ]);
    });

    // Aba de Detalhamento
    const detalheSheet = workbook.addWorksheet('Detalhamento');
    detalheSheet.columns = [
      { header: 'Servidor', key: 'servidor', width: 30 },
      { header: 'Órgão', key: 'orgao', width: 20 },
      { header: 'Margem Total', key: 'margemTotal', width: 15 },
      { header: 'Margem Usada', key: 'margemUsada', width: 15 },
      { header: 'Margem Disponível', key: 'margemDisponivel', width: 15 },
      { header: 'Contratos', key: 'contratos', width: 10 },
      { header: 'Atualização', key: 'atualizacao', width: 20 }
    ];

    dados.servidores.forEach((item: RelatorioMargem) => {
      detalheSheet.addRow({
        servidor: item.servidor,
        orgao: item.orgao,
        margemTotal: this.formatarMoeda(item.margemTotal),
        margemUsada: this.formatarMoeda(item.margemUsada),
        margemDisponivel: this.formatarMoeda(item.margemDisponivel),
        contratos: item.quantidadeContratos,
        atualizacao: this.formatarData(item.dataAtualizacao)
      });
    });

    const filePath = `/tmp/margem-${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private async gerarCSV(dados: any): Promise<string> {
    const linhas = [
      ['Servidor', 'Órgão', 'Margem Total', 'Margem Usada', 'Margem Disponível', 'Contratos', 'Atualização'].join(',')
    ];

    dados.servidores.forEach((item: RelatorioMargem) => {
      linhas.push([
        item.servidor,
        item.orgao,
        this.formatarMoeda(item.margemTotal),
        this.formatarMoeda(item.margemUsada),
        this.formatarMoeda(item.margemDisponivel),
        item.quantidadeContratos,
        this.formatarData(item.dataAtualizacao)
      ].join(','));
    });

    const conteudo = linhas.join('\n');
    const filePath = `/tmp/margem-${Date.now()}.csv`;
    require('fs').writeFileSync(filePath, conteudo);
    return filePath;
  }
}
