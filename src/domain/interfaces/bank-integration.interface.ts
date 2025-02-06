export interface BankProposal {
  id: string;
  bankId: number;
  cpf: string;
  value: number;
  installments: number;
  installmentValue: number;
  interestRate: number;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankContract {
  id: string;
  proposalId: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  documents: ContractDocument[];
}

export interface ContractDocument {
  id: string;
  type: DocumentType;
  url: string;
  hash: string;
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  FINISHED = 'FINISHED',
  PORTABILITY = 'PORTABILITY'
}

export enum DocumentType {
  CONTRACT = 'CONTRACT',
  IDENTITY = 'IDENTITY',
  INCOME_PROOF = 'INCOME_PROOF',
  ADDRESS_PROOF = 'ADDRESS_PROOF'
}

export interface BankIntegrationConfig {
  id: number;
  name: string;
  code: string;
  type: 'REST' | 'SOAP' | 'SFTP';
  baseUrl?: string;
  username?: string;
  password?: string;
  certificate?: string;
  webhookUrl?: string;
  active: boolean;
}

export interface BankWebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: Date;
  signature: string;
}

export enum WebhookEvent {
  PROPOSAL_CREATED = 'PROPOSAL_CREATED',
  PROPOSAL_UPDATED = 'PROPOSAL_UPDATED',
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  CONTRACT_UPDATED = 'CONTRACT_UPDATED'
}
