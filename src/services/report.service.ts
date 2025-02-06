import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import { QueueService } from '../infrastructure/queue/queue.service';
import { 
  ReportConfig,
  ReportResult,
  ReportTemplate,
  ReportMetadata,
} from '../domain/interfaces/report.interface';
import { ReportType } from '../domain/enums/report-type.enum';
import { ReportFormat } from '../domain/enums/report-format.enum';
import * as handlebars from 'handlebars';
import * as ExcelJS from 'exceljs';
import * as PDFKit from 'pdfkit';
import { Readable } from 'stream';
import { createHash } from 'crypto';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
  ) {}

  async generateReport(
    config: ReportConfig,
    filters: Record<string, any> = {},
  ): Promise<ReportResult> {
    const startTime = Date.now();

    try {
      this.logger.log(
        'Iniciando geração de relatório',
        'ReportService',
        { tipo: config.tipo, formato: config.formato }
      );

      // Busca template
      const template = await this.getTemplate(config.tipo, config.formato);

      // Busca dados conforme tipo do relatório
      const data = await this.fetchReportData(config.tipo, filters);

      // Gera metadados
      const metadata: ReportMetadata = {
        totalRegistros: Array.isArray(data) ? data.length : 1,
        dataInicio: new Date(filters.dataInicio || new Date()),
        dataFim: new Date(filters.dataFim || new Date()),
        filtrosAplicados: filters,
        tempoProcessamento: Date.now() - startTime,
        usuario: filters.usuario,
      };

      // Gera relatório no formato solicitado
      const content = await this.formatReport(
        template,
        data,
        metadata,
        config.formato
      );

      // Calcula hash do conteúdo
      const hash = this.calculateHash(content);

      // Salva no storage
      const fileName = this.generateFileName(config, hash);
      const url = await this.storage.save(
        `reports/${config.tipo}/${fileName}`,
        content,
        config.formato.toLowerCase()
      );

      // Registra geração
      const result: ReportResult = {
        id: hash,
        config,
        data: metadata,
        formato: config.formato,
        tamanho: content.length,
        hash,
        geradoEm: new Date(),
        url,
      };

      await this.prisma.reportLog.create({
        data: {
          reportConfigId: config.id,
          hash,
          metadata,
          url,
          tamanho: content.length,
        },
      });

      this.logger.log(
        'Relatório gerado com sucesso',
        'ReportService',
        { 
          tipo: config.tipo,
          formato: config.formato,
          hash,
          tamanho: content.length
        }
      );

      return result;
    } catch (error) {
      this.logger.error(
        'Erro ao gerar relatório',
        error.stack,
        'ReportService',
        { tipo: config.tipo, formato: config.formato }
      );
      throw error;
    }
  }

  private async getTemplate(
    tipo: ReportType,
    formato: ReportFormat
  ): Promise<ReportTemplate> {
    const template = await this.prisma.reportTemplate.findFirst({
      where: {
        tipo,
        formato,
        ativo: true,
      },
      orderBy: {
        versao: 'desc',
      },
    });

    if (!template) {
      throw new Error(`Template não encontrado para ${tipo} em ${formato}`);
    }

    return template;
  }

  private async fetchReportData(
    tipo: ReportType,
    filters: Record<string, any>
  ): Promise<any> {
    const { dataInicio, dataFim } = filters;

    switch (tipo) {
      case ReportType.FOLHA_PAGAMENTO:
        return this.prisma.folhaPagamento.findMany({
          where: {
            createdAt: {
              gte: dataInicio,
              lte: dataFim,
            },
            ...filters,
          },
          include: {
            servidor: true,
          },
        });

      case ReportType.MARGEM:
        return this.prisma.servidor.findMany({
          where: filters,
          include: {
            contratos: true,
            folhaPagamento: {
              orderBy: {
                competencia: 'desc',
              },
              take: 1,
            },
          },
        });

      case ReportType.AVERBACAO:
        return this.prisma.contrato.findMany({
          where: {
            dataAverbacao: {
              gte: dataInicio,
              lte: dataFim,
            },
            ...filters,
          },
          include: {
            servidor: true,
            consignataria: true,
          },
        });

      // Adicione outros tipos conforme necessário

      default:
        throw new Error(`Tipo de relatório não suportado: ${tipo}`);
    }
  }

  private async formatReport(
    template: ReportTemplate,
    data: any,
    metadata: ReportMetadata,
    formato: ReportFormat
  ): Promise<Buffer> {
    switch (formato) {
      case ReportFormat.PDF:
        return this.generatePDF(template, data, metadata);

      case ReportFormat.EXCEL:
        return this.generateExcel(template, data, metadata);

      case ReportFormat.HTML:
        return this.generateHTML(template, data, metadata);

      case ReportFormat.CSV:
        return this.generateCSV(data);

      case ReportFormat.JSON:
        return Buffer.from(JSON.stringify({ data, metadata }, null, 2));

      default:
        throw new Error(`Formato não suportado: ${formato}`);
    }
  }

  private async generatePDF(
    template: ReportTemplate,
    data: any,
    metadata: ReportMetadata
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFKit();

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Renderiza template HTML
      const html = this.renderTemplate(template, { data, metadata });

      // Adiciona conteúdo ao PDF
      doc.html(html, {
        continueOnError: true,
        javascriptEnabled: false,
      });

      doc.end();
    });
  }

  private async generateExcel(
    template: ReportTemplate,
    data: any,
    metadata: ReportMetadata
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');

    // Adiciona cabeçalho
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Adiciona dados
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
    }

    // Adiciona metadados
    const metaSheet = workbook.addWorksheet('Metadados');
    Object.entries(metadata).forEach(([key, value]) => {
      metaSheet.addRow([key, value]);
    });

    return workbook.xlsx.writeBuffer();
  }

  private generateHTML(
    template: ReportTemplate,
    data: any,
    metadata: ReportMetadata
  ): Promise<Buffer> {
    const html = this.renderTemplate(template, { data, metadata });
    return Promise.resolve(Buffer.from(html));
  }

  private generateCSV(data: any[]): Promise<Buffer> {
    if (!Array.isArray(data) || data.length === 0) {
      return Promise.resolve(Buffer.from(''));
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => row[header]).join(',')
    );

    const csv = [
      headers.join(','),
      ...rows
    ].join('\n');

    return Promise.resolve(Buffer.from(csv));
  }

  private renderTemplate(
    template: ReportTemplate,
    context: any
  ): string {
    const compiledTemplate = handlebars.compile(template.conteudo);
    return compiledTemplate(context);
  }

  private calculateHash(content: Buffer): string {
    return createHash('sha256')
      .update(content)
      .digest('hex');
  }

  private generateFileName(config: ReportConfig, hash: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${config.tipo}_${timestamp}_${hash}.${config.formato.toLowerCase()}`;
  }
}
