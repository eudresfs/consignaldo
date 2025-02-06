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
var BankIntegrationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../infrastructure/prisma/prisma.service");
const crypto_service_1 = require("../infrastructure/crypto/crypto.service");
const queue_service_1 = require("../infrastructure/queue/queue.service");
const cache_service_1 = require("../infrastructure/cache/cache.service");
const bank_integration_interface_1 = require("../domain/interfaces/bank-integration.interface");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
let BankIntegrationService = BankIntegrationService_1 = class BankIntegrationService {
    constructor(prisma, config, crypto, queue, cache) {
        this.prisma = prisma;
        this.config = config;
        this.crypto = crypto;
        this.queue = queue;
        this.cache = cache;
        this.logger = new common_1.Logger(BankIntegrationService_1.name);
    }
    async importProposals(bankId) {
        const config = await this.getBankConfig(bankId);
        if (!config.active) {
            throw new Error(`Bank integration ${bankId} is not active`);
        }
        try {
            const proposals = await this.fetchProposalsFromBank(config);
            await this.queue.add('process-proposals', { bankId, proposals });
            return proposals;
        }
        catch (error) {
            this.logger.error(`Error importing proposals from bank ${bankId}:`, error);
            throw error;
        }
    }
    async exportContract(contractId, bankId) {
        const config = await this.getBankConfig(bankId);
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                proposal: true,
                documents: true,
            },
        });
        if (!contract) {
            throw new Error(`Contract ${contractId} not found`);
        }
        try {
            await this.sendContractToBank(contract, config);
            await this.prisma.contract.update({
                where: { id: contractId },
                data: {
                    exportedAt: new Date(),
                    status: 'EXPORTED',
                },
            });
        }
        catch (error) {
            this.logger.error(`Error exporting contract ${contractId} to bank ${bankId}:`, error);
            throw error;
        }
    }
    async handleWebhook(payload, bankId) {
        const config = await this.getBankConfig(bankId);
        if (!this.verifyWebhookSignature(payload, config)) {
            throw new Error('Invalid webhook signature');
        }
        switch (payload.event) {
            case bank_integration_interface_1.WebhookEvent.PROPOSAL_CREATED:
            case bank_integration_interface_1.WebhookEvent.PROPOSAL_UPDATED:
                await this.handleProposalWebhook(payload.data);
                break;
            case bank_integration_interface_1.WebhookEvent.CONTRACT_CREATED:
            case bank_integration_interface_1.WebhookEvent.CONTRACT_UPDATED:
                await this.handleContractWebhook(payload.data);
                break;
            default:
                this.logger.warn(`Unknown webhook event: ${payload.event}`);
        }
    }
    async getBankConfig(bankId) {
        const cacheKey = `bank-config:${bankId}`;
        let config = await this.cache.get(cacheKey);
        if (!config) {
            config = await this.prisma.bankIntegration.findUnique({
                where: { id: bankId },
            });
            if (!config) {
                throw new Error(`Bank integration config ${bankId} not found`);
            }
            await this.cache.set(cacheKey, config, 3600); // 1 hour
        }
        return config;
    }
    async fetchProposalsFromBank(config) {
        switch (config.type) {
            case 'REST':
                return this.fetchProposalsREST(config);
            case 'SOAP':
                return this.fetchProposalsSOAP(config);
            case 'SFTP':
                return this.fetchProposalsSFTP(config);
            default:
                throw new Error(`Unsupported integration type: ${config.type}`);
        }
    }
    async sendContractToBank(contract, config) {
        switch (config.type) {
            case 'REST':
                await this.sendContractREST(contract, config);
                break;
            case 'SOAP':
                await this.sendContractSOAP(contract, config);
                break;
            case 'SFTP':
                await this.sendContractSFTP(contract, config);
                break;
            default:
                throw new Error(`Unsupported integration type: ${config.type}`);
        }
    }
    async fetchProposalsREST(config) {
        const response = await axios_1.default.get(`${config.baseUrl}/proposals`, {
            headers: this.getAuthHeaders(config),
        });
        return response.data;
    }
    async fetchProposalsSOAP(config) {
        // Implementar integração SOAP
        throw new Error('SOAP integration not implemented');
    }
    async fetchProposalsSFTP(config) {
        // Implementar integração SFTP
        throw new Error('SFTP integration not implemented');
    }
    async sendContractREST(contract, config) {
        await axios_1.default.post(`${config.baseUrl}/contracts`, contract, { headers: this.getAuthHeaders(config) });
    }
    async sendContractSOAP(contract, config) {
        // Implementar envio SOAP
        throw new Error('SOAP integration not implemented');
    }
    async sendContractSFTP(contract, config) {
        // Implementar envio SFTP
        throw new Error('SFTP integration not implemented');
    }
    getAuthHeaders(config) {
        // Implementar headers de autenticação específicos para cada banco
        return {
            'Authorization': `Bearer ${config.password}`,
            'X-Bank-Code': config.code,
        };
    }
    verifyWebhookSignature(payload, config) {
        const signature = crypto
            .createHmac('sha256', config.password)
            .update(JSON.stringify(payload.data))
            .digest('hex');
        return signature === payload.signature;
    }
    async handleProposalWebhook(data) {
        await this.prisma.proposal.upsert({
            where: { externalId: data.id },
            update: {
                status: data.status,
                updatedAt: new Date(),
            },
            create: {
                externalId: data.id,
                bankId: data.bankId,
                status: data.status,
                // ... outros campos
            },
        });
    }
    async handleContractWebhook(data) {
        await this.prisma.contract.upsert({
            where: { externalId: data.id },
            update: {
                status: data.status,
                updatedAt: new Date(),
            },
            create: {
                externalId: data.id,
                proposalId: data.proposalId,
                status: data.status,
                // ... outros campos
            },
        });
    }
};
exports.BankIntegrationService = BankIntegrationService;
exports.BankIntegrationService = BankIntegrationService = BankIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService, typeof (_a = typeof crypto_service_1.CryptoService !== "undefined" && crypto_service_1.CryptoService) === "function" ? _a : Object, queue_service_1.QueueService,
        cache_service_1.CacheService])
], BankIntegrationService);
