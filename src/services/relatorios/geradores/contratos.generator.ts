import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RelatorioGenerator } from './base.generator';
import { RelatorioContrato } from '../../../domain/relatorios/relatorios.types';
import { FiltrosContratoDTO } from '../../../dtos/relatorios/relatorios.dto';
import { FormatoRelatorio } from '../../../domain/relatorios/relatorios.types';
import { Template } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as PDFKit from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class ContratosGenerator extends RelatorioGenerator<RelatorioContrato> {
  constructor(
    template: Template,
    formato: FormatoRelatorio,
    filtros: FiltrosContratoDTO,
    private prisma: PrismaService
  ) {
    super(template, formato, filtros);
  }

  async buscarDados(): Promise<RelatorioContrato[]> {
    const { dataInicio, dataFim, status, banco, valorMinimo, valorMaximo } = this.filtros as FiltrosContratoDTO;

    const contratos = await this.prisma.contrato.findMany({
      where: {
        ...(dataInicio && dataFim && {
          criadoEm: {
            gte: new Date(dataInicio),
            lte: new Date(dataFim)
          }
        }),
        ...(status && { status }),
        ...(banco && { bancoId: banco }),
        ...(valorMinimo && { valor: { gte: valorMinimo } }),
        ...(valorMaximo && { valor: { lte: valorMaximo } })
      },
      include: {
        servidor: {
          select: {
            nome: true
          }
        },
        banco: {
          select: {
            nome: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    return contratos.map(contrato => ({
      id: contrato.id,
      numero: contrato.numero,
      servidor: contrato.servidor.nome,
      banco: contrato.banco.nome,
      valor: contrato.valor,
      parcelas: contrato.quantidadeParcelas,
      status: contrato.status,
      dataCriacao: contrato.criadoEm,
      dataAtualizacao: contrato.atualizadoEm
    }));
  }

  async processarDados(dados: RelatorioContrato[]): Promise<any> {
    const totalContratos = dados.length;
    const valorTotal = dados.reduce((sum, contrato) => sum + contrato.valor, 0);
    const mediaValor = valorTotal / totalContratos;

    const statusCount = dados.reduce((acc, contrato) => {
      acc[contrato.status] = (acc[contrato.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      contratos: dados,
      resumo: {
        totalContratos,
        valorTotal: this.formatarMoeda(valorTotal),
        mediaValor: this.formatarMoeda(mediaValor),
        distribuicaoStatus: statusCount
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
        const filePath = `/tmp/contratos-${Date.now()}.pdf`;
        require('fs').writeFileSync(filePath, result);
        resolve(filePath);
      });
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(16).text('Relatório de Contratos', { align: 'center' });
      doc.moveDown();

      // Resumo
      doc.fontSize(12).text('Resumo', { underline: true });
      doc.fontSize(10)
        .text(`Total de Contratos: ${dados.resumo.totalContratos}`)
        .text(`Valor Total: ${dados.resumo.valorTotal}`)
        .text(`Média por Contrato: ${dados.resumo.mediaValor}`);
      doc.moveDown();

      // Tabela de Contratos
      const table = {
        headers: ['Número', 'Servidor', 'Banco', 'Valor', 'Parcelas', 'Status'],
        rows: dados.contratos.map((contrato: RelatorioContrato) => [
          contrato.numero,
          contrato.servidor,
          contrato.banco,
          this.formatarMoeda(contrato.valor),
          contrato.parcelas,
          contrato.status
        ])
      };

      // Renderizar tabela
      let y = doc.y;
      const rowHeight = 20;
      const colWidths = [80, 150, 100, 80, 50, 80];

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
      });

      doc.end();
    });
  }

  private async gerarExcel(dados: any): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contratos');

    // Estilos
    const headerStyle = {
      font: { bold: true },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
    };

    // Headers
    worksheet.columns = [
      { header: 'Número', key: 'numero', width: 15 },
      { header: 'Servidor', key: 'servidor', width: 30 },
      { header: 'Banco', key: 'banco', width: 20 },
      { header: 'Valor', key: 'valor', width: 15 },
      { header: 'Parcelas', key: 'parcelas', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Data Criação', key: 'dataCriacao', width: 20 }
    ];

    // Aplicar estilo no header
    worksheet.getRow(1).eachCell(cell => {
      cell.style = headerStyle;
    });

    // Dados
    dados.contratos.forEach((contrato: RelatorioContrato) => {
      worksheet.addRow({
        numero: contrato.numero,
        servidor: contrato.servidor,
        banco: contrato.banco,
        valor: contrato.valor,
        parcelas: contrato.parcelas,
        status: contrato.status,
        dataCriacao: this.formatarData(contrato.dataCriacao)
      });
    });

    // Resumo em nova aba
    const resumoSheet = workbook.addWorksheet('Resumo');
    resumoSheet.addRow(['Total de Contratos', dados.resumo.totalContratos]);
    resumoSheet.addRow(['Valor Total', dados.resumo.valorTotal]);
    resumoSheet.addRow(['Média por Contrato', dados.resumo.mediaValor]);

    const filePath = `/tmp/contratos-${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private async gerarCSV(dados: any): Promise<string> {
    const linhas = [
      ['Número', 'Servidor', 'Banco', 'Valor', 'Parcelas', 'Status', 'Data Criação'].join(',')
    ];

    dados.contratos.forEach((contrato: RelatorioContrato) => {
      linhas.push([
        contrato.numero,
        contrato.servidor,
        contrato.banco,
        contrato.valor,
        contrato.parcelas,
        contrato.status,
        this.formatarData(contrato.dataCriacao)
      ].join(','));
    });

    const conteudo = linhas.join('\n');
    const filePath = `/tmp/contratos-${Date.now()}.csv`;
    require('fs').writeFileSync(filePath, conteudo);
    return filePath;
  }
}
