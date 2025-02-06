"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const logger_service_1 = require("../logger/logger.service");
let QueueService = class QueueService {
    constructor(folhaPagamentoQueue, averbacaoQueue, logger) {
        this.folhaPagamentoQueue = folhaPagamentoQueue;
        this.averbacaoQueue = averbacaoQueue;
        this.logger = logger;
    }
    async adicionarJobFolha(data) {
        try {
            const job = await this.folhaPagamentoQueue.add('processar-folha', data, {
                jobId: `folha-${data.consignanteId}-${data.competencia}`,
            });
            this.logger.log('Job de processamento de folha adicionado', 'QueueService', { jobId: job.id });
            return job;
        }
        catch (error) {
            this.logger.error('Erro ao adicionar job de folha', error.stack, 'QueueService', { consignanteId: data.consignanteId });
            throw error;
        }
    }
    async adicionarJobAverbacao(data) {
        try {
            const job = await this.averbacaoQueue.add('processar-averbacao', data, {
                jobId: `averbacao-${data.consignanteId}-${data.contrato}`,
                priority: 1, // Alta prioridade
            });
            this.logger.log('Job de averbação adicionado', 'QueueService', { jobId: job.id });
            return job;
        }
        catch (error) {
            this.logger.error('Erro ao adicionar job de averbação', error.stack, 'QueueService', { consignanteId: data.consignanteId });
            throw error;
        }
    }
    async getJobStatus(queueName, jobId) {
        const queue = this.getQueueByName(queueName);
        const job = await queue.getJob(jobId);
        if (!job) {
            return null;
        }
        const state = await job.getState();
        const progress = job.progress();
        const failCount = job.attemptsMade;
        return {
            id: job.id,
            state,
            progress,
            failCount,
            data: job.data,
            returnvalue: job.returnvalue,
            failedReason: job.failedReason,
            timestamp: job.timestamp,
        };
    }
    async limparFilas() {
        await Promise.all([
            this.folhaPagamentoQueue.clean(0, 'completed'),
            this.averbacaoQueue.clean(0, 'completed'),
        ]);
    }
    getQueueByName(name) {
        switch (name) {
            case 'folha-pagamento':
                return this.folhaPagamentoQueue;
            case 'averbacao':
                return this.averbacaoQueue;
            default:
                throw new Error(`Fila ${name} não encontrada`);
        }
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('folha-pagamento')),
    __param(1, (0, bull_1.InjectQueue)('averbacao')),
    __metadata("design:paramtypes", [Object, Object, logger_service_1.LoggerService])
], QueueService);
