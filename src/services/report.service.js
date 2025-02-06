"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
const storage_service_1 = require("../infrastructure/storage/storage.service");
const queue_service_1 = require("../infrastructure/queue/queue.service");
const report_type_enum_1 = require("../domain/enums/report-type.enum");
const report_format_enum_1 = require("../domain/enums/report-format.enum");
const handlebars = __importStar(require("handlebars"));
const ExcelJS = __importStar(require("exceljs"));
const PDFKit = __importStar(require("pdfkit"));
const crypto_1 = require("crypto");
let ReportService = class ReportService {
    constructor(prisma, logger, storage, queue) {
        this.prisma = prisma;
        this.logger = logger;
        this.storage = storage;
        this.queue = queue;
    }
    async generateReport(config, filters = {}) {
        const startTime = Date.now();
        try {
            this.logger.log('Iniciando geração de relatório', 'ReportService', { tipo: config.tipo, formato: config.formato });
            // Busca template
            const template = await this.getTemplate(config.tipo, config.formato);
            // Busca dados conforme tipo do relatório
            const data = await this.fetchReportData(config.tipo, filters);
            // Gera metadados
            const metadata = {
                totalRegistros: Array.isArray(data) ? data.length : 1,
                dataInicio: new Date(filters.dataInicio || new Date()),
                dataFim: new Date(filters.dataFim || new Date()),
                filtrosAplicados: filters,
                tempoProcessamento: Date.now() - startTime,
                usuario: filters.usuario,
            };
            // Gera relatório no formato solicitado
            const content = await this.formatReport(template, data, metadata, config.formato);
            // Calcula hash do conteúdo
            const hash = this.calculateHash(content);
            // Salva no storage
            const fileName = this.generateFileName(config, hash);
            const url = await this.storage.save(`reports/${config.tipo}/${fileName}`, content, config.formato.toLowerCase());
            // Registra geração
            const result = {
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
            this.logger.log('Relatório gerado com sucesso', 'ReportService', {
                tipo: config.tipo,
                formato: config.formato,
                hash,
                tamanho: content.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('Erro ao gerar relatório', error.stack, 'ReportService', { tipo: config.tipo, formato: config.formato });
            throw error;
        }
    }
    async getTemplate(tipo, formato) {
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
    async fetchReportData(tipo, filters) {
        const { dataInicio, dataFim } = filters;
        switch (tipo) {
            case report_type_enum_1.ReportType.FOLHA_PAGAMENTO:
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
            case report_type_enum_1.ReportType.MARGEM:
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
            case report_type_enum_1.ReportType.AVERBACAO:
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
    async formatReport(template, data, metadata, formato) {
        switch (formato) {
            case report_format_enum_1.ReportFormat.PDF:
                return this.generatePDF(template, data, metadata);
            case report_format_enum_1.ReportFormat.EXCEL:
                return this.generateExcel(template, data, metadata);
            case report_format_enum_1.ReportFormat.HTML:
                return this.generateHTML(template, data, metadata);
            case report_format_enum_1.ReportFormat.CSV:
                return this.generateCSV(data);
            case report_format_enum_1.ReportFormat.JSON:
                return Buffer.from(JSON.stringify({ data, metadata }, null, 2));
            default:
                throw new Error(`Formato não suportado: ${formato}`);
        }
    }
    async generatePDF(template, data, metadata) {
        return new Promise((resolve, reject) => {
            const chunks = [];
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
    async generateExcel(template, data, metadata) {
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
    generateHTML(template, data, metadata) {
        const html = this.renderTemplate(template, { data, metadata });
        return Promise.resolve(Buffer.from(html));
    }
    generateCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return Promise.resolve(Buffer.from(''));
        }
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => row[header]).join(','));
        const csv = [
            headers.join(','),
            ...rows
        ].join('\n');
        return Promise.resolve(Buffer.from(csv));
    }
    renderTemplate(template, context) {
        const compiledTemplate = handlebars.compile(template.conteudo);
        return compiledTemplate(context);
    }
    calculateHash(content) {
        return (0, crypto_1.createHash)('sha256')
            .update(content)
            .digest('hex');
    }
    generateFileName(config, hash) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `${config.tipo}_${timestamp}_${hash}.${config.formato.toLowerCase()}`;
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        storage_service_1.StorageService,
        queue_service_1.QueueService])
], ReportService);
