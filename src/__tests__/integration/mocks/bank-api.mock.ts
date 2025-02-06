import { Injectable } from '@nestjs/common';
import * as nock from 'nock';

@Injectable()
export class BankApiMock {
  private baseUrl = 'http://api.banco-teste.com';

  setupMocks() {
    // Mock para busca de propostas
    nock(this.baseUrl)
      .get('/proposals')
      .reply(200, [
        {
          id: '1',
          value: 10000,
          status: 'PENDING',
        },
      ]);

    // Mock para envio de contratos
    nock(this.baseUrl)
      .post('/contracts')
      .reply(201, {
        id: '1',
        status: 'ACTIVE',
      });

    // Mock para verificação de margem
    nock(this.baseUrl)
      .get('/margin-check')
      .reply(200, {
        available: true,
        margin: 1500,
      });

    // Mock para erros
    nock(this.baseUrl)
      .get('/error')
      .reply(500, {
        error: 'Internal Server Error',
      });
  }

  cleanupMocks() {
    nock.cleanAll();
  }

  mockProposalApproval(proposalId: string) {
    return nock(this.baseUrl)
      .patch(`/proposals/${proposalId}`)
      .reply(200, {
        id: proposalId,
        status: 'APPROVED',
      });
  }

  mockProposalRejection(proposalId: string, reason: string) {
    return nock(this.baseUrl)
      .patch(`/proposals/${proposalId}`)
      .reply(200, {
        id: proposalId,
        status: 'REJECTED',
        reason,
      });
  }

  mockTimeout() {
    return nock(this.baseUrl)
      .get('/proposals')
      .delayConnection(5000)
      .reply(200);
  }

  mockNetworkError() {
    return nock(this.baseUrl)
      .get('/proposals')
      .replyWithError('network error');
  }
}
