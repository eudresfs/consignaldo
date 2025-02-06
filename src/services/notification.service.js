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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const logger_service_1 = require("../infrastructure/logger/logger.service");
const queue_service_1 = require("../infrastructure/queue/queue.service");
const notification_type_enum_1 = require("../domain/enums/notification-type.enum");
const nodemailer = __importStar(require("nodemailer"));
const handlebars = __importStar(require("handlebars"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
let NotificationService = class NotificationService {
    constructor(prisma, logger, queue, config) {
        this.prisma = prisma;
        this.logger = logger;
        this.queue = queue;
        this.config = config;
        // Configura transportador de email
        this.emailTransporter = nodemailer.createTransport({
            host: this.config.get('SMTP_HOST'),
            port: this.config.get('SMTP_PORT'),
            secure: this.config.get('SMTP_SECURE', true),
            auth: {
                user: this.config.get('SMTP_USER'),
                pass: this.config.get('SMTP_PASS'),
            },
        });
    }
    async notify(data) {
        try {
            // Busca configurações ativas para o evento
            const configs = await this.prisma.notificationConfig.findMany({
                where: {
                    evento: data.evento,
                    ativo: true,
                },
                include: {
                    template: true,
                },
            });
            if (!configs.length) {
                this.logger.warn('Nenhuma configuração encontrada para o evento', 'NotificationService', { evento: data.evento });
                return [];
            }
            // Processa cada configuração
            const results = await Promise.all(configs.map(config => this.processNotification(config, data)));
            return results;
        }
        catch (error) {
            this.logger.error('Erro ao processar notificação', error.stack, 'NotificationService', { evento: data.evento });
            throw error;
        }
    }
    async processNotification(config, data) {
        const id = (0, uuid_1.v4)();
        const result = {
            id,
            config,
            template: config.template,
            data,
            status: 'PENDENTE',
            tentativas: 0,
        };
        try {
            // Renderiza template
            const content = this.renderTemplate(config.template, data.dados);
            // Envia notificação conforme tipo
            switch (config.tipo) {
                case notification_type_enum_1.NotificationType.EMAIL:
                    await this.sendEmail(config, content, data);
                    break;
                case notification_type_enum_1.NotificationType.WEBHOOK:
                    await this.sendWebhook(config, data);
                    break;
                case notification_type_enum_1.NotificationType.PUSH:
                    await this.sendPushNotification(config, content, data);
                    break;
                // Implementar outros tipos conforme necessário
            }
            result.status = 'ENVIADO';
            result.enviadoEm = new Date();
        }
        catch (error) {
            result.status = 'ERRO';
            result.erro = error.message;
            // Se configurado retry, adiciona à fila
            if (config.retry && result.tentativas < config.retry.attempts) {
                await this.scheduleRetry(config, data, result.tentativas + 1);
            }
            this.logger.error('Erro ao enviar notificação', error.stack, 'NotificationService', {
                id,
                tipo: config.tipo,
                evento: data.evento
            });
        }
        // Registra resultado
        await this.prisma.notificationLog.create({
            data: {
                id,
                configId: config.id,
                templateId: config.template.id,
                evento: data.evento,
                status: result.status,
                erro: result.erro,
                tentativas: result.tentativas,
                metadata: data.metadata,
            },
        });
        return result;
    }
    renderTemplate(template, data) {
        const compile = handlebars.compile(template.html || template.conteudo);
        return compile(data);
    }
    async sendEmail(config, content, data) {
        const destinatarios = data.destinatarios || config.destinatarios;
        if (!destinatarios?.length) {
            throw new Error('Nenhum destinatário configurado');
        }
        await this.emailTransporter.sendMail({
            from: this.config.get('SMTP_FROM'),
            to: destinatarios.join(', '),
            subject: config.template.assunto,
            html: content,
        });
    }
    async sendWebhook(config, data) {
        if (!config.webhookUrl) {
            throw new Error('URL do webhook não configurada');
        }
        await axios_1.default.post(config.webhookUrl, {
            evento: data.evento,
            dados: data.dados,
            metadata: data.metadata,
        }, {
            headers: config.headers,
        });
    }
    async sendPushNotification(config, content, data) {
        // Implementar integração com serviço de push
        throw new Error('Não implementado');
    }
    async scheduleRetry(config, data, attempt) {
        const delay = config.retry.delay * Math.pow(config.retry.multiplier, attempt - 1);
        await this.queue.add('notification', {
            config,
            data,
            attempt,
        }, {
            delay,
            attempts: 1,
        });
    }
    async getTemplates(tipo, evento) {
        return this.prisma.notificationTemplate.findMany({
            where: {
                ...(tipo && { tipo }),
                ...(evento && { evento }),
                ativo: true,
            },
            orderBy: {
                versao: 'desc',
            },
        });
    }
    async createTemplate(template) {
        return this.prisma.notificationTemplate.create({
            data: template,
        });
    }
    async updateTemplate(id, template) {
        return this.prisma.notificationTemplate.update({
            where: { id },
            data: {
                ...template,
                versao: { increment: 1 },
            },
        });
    }
    async deleteTemplate(id) {
        await this.prisma.notificationTemplate.update({
            where: { id },
            data: { ativo: false },
        });
    }
    async getConfigs(tipo, evento) {
        return this.prisma.notificationConfig.findMany({
            where: {
                ...(tipo && { tipo }),
                ...(evento && { evento }),
                ativo: true,
            },
            include: {
                template: true,
            },
        });
    }
    async createConfig(config) {
        return this.prisma.notificationConfig.create({
            data: config,
            include: {
                template: true,
            },
        });
    }
    async updateConfig(id, config) {
        return this.prisma.notificationConfig.update({
            where: { id },
            data: config,
            include: {
                template: true,
            },
        });
    }
    async deleteConfig(id) {
        await this.prisma.notificationConfig.update({
            where: { id },
            data: { ativo: false },
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        queue_service_1.QueueService,
        config_1.ConfigService])
], NotificationService);
