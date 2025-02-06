import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CryptoService } from '../infrastructure/crypto/crypto.service';
import { QueueService } from '../infrastructure/queue/queue.service';
import { CacheService } from '../infrastructure/cache/cache.service';
import { 
  BankIntegrationConfig,
  BankProposal,
  BankContract,
  BankWebhookPayload,
  WebhookEvent
} from '../domain/interfaces/bank-integration.interface';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class BankIntegrationService {
  private readonly logger = new Logger(BankIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    private readonly queue: QueueService,
    private readonly cache: CacheService,
  ) {}

  async importProposals(bankId: number): Promise<BankProposal[]> {
    const config = await this.getBankConfig(bankId);
    if (!config.active) {
      throw new Error(`Bank integration ${bankId} is not active`);
    }

    try {
      const proposals = await this.fetchProposalsFromBank(config);
      await this.queue.add('process-proposals', { bankId, proposals });
      return proposals;
    } catch (error) {
      this.logger.error(`Error importing proposals from bank ${bankId}:`, error);
      throw error;
    }
  }

  async exportContract(contractId: string, bankId: number): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Error exporting contract ${contractId} to bank ${bankId}:`, error);
      throw error;
    }
  }

  async handleWebhook(payload: BankWebhookPayload, bankId: number): Promise<void> {
    const config = await this.getBankConfig(bankId);
    
    if (!this.verifyWebhookSignature(payload, config)) {
      throw new Error('Invalid webhook signature');
    }

    switch (payload.event) {
      case WebhookEvent.PROPOSAL_CREATED:
      case WebhookEvent.PROPOSAL_UPDATED:
        await this.handleProposalWebhook(payload.data);
        break;
      case WebhookEvent.CONTRACT_CREATED:
      case WebhookEvent.CONTRACT_UPDATED:
        await this.handleContractWebhook(payload.data);
        break;
      default:
        this.logger.warn(`Unknown webhook event: ${payload.event}`);
    }
  }

  private async getBankConfig(bankId: number): Promise<BankIntegrationConfig> {
    const cacheKey = `bank-config:${bankId}`;
    let config = await this.cache.get<BankIntegrationConfig>(cacheKey);

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

  private async fetchProposalsFromBank(config: BankIntegrationConfig): Promise<BankProposal[]> {
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

  private async sendContractToBank(contract: any, config: BankIntegrationConfig): Promise<void> {
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

  private async fetchProposalsREST(config: BankIntegrationConfig): Promise<BankProposal[]> {
    const response = await axios.get(`${config.baseUrl}/proposals`, {
      headers: this.getAuthHeaders(config),
    });
    return response.data;
  }

  private async fetchProposalsSOAP(config: BankIntegrationConfig): Promise<BankProposal[]> {
    // Implementar integração SOAP
    throw new Error('SOAP integration not implemented');
  }

  private async fetchProposalsSFTP(config: BankIntegrationConfig): Promise<BankProposal[]> {
    // Implementar integração SFTP
    throw new Error('SFTP integration not implemented');
  }

  private async sendContractREST(contract: any, config: BankIntegrationConfig): Promise<void> {
    await axios.post(
      `${config.baseUrl}/contracts`,
      contract,
      { headers: this.getAuthHeaders(config) }
    );
  }

  private async sendContractSOAP(contract: any, config: BankIntegrationConfig): Promise<void> {
    // Implementar envio SOAP
    throw new Error('SOAP integration not implemented');
  }

  private async sendContractSFTP(contract: any, config: BankIntegrationConfig): Promise<void> {
    // Implementar envio SFTP
    throw new Error('SFTP integration not implemented');
  }

  private getAuthHeaders(config: BankIntegrationConfig): Record<string, string> {
    // Implementar headers de autenticação específicos para cada banco
    return {
      'Authorization': `Bearer ${config.password}`,
      'X-Bank-Code': config.code,
    };
  }

  private verifyWebhookSignature(payload: BankWebhookPayload, config: BankIntegrationConfig): boolean {
    const signature = crypto
      .createHmac('sha256', config.password)
      .update(JSON.stringify(payload.data))
      .digest('hex');

    return signature === payload.signature;
  }

  private async handleProposalWebhook(data: any): Promise<void> {
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

  private async handleContractWebhook(data: any): Promise<void> {
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
}
