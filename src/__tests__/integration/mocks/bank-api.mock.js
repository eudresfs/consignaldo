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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankApiMock = void 0;
const common_1 = require("@nestjs/common");
const nock = __importStar(require("nock"));
let BankApiMock = class BankApiMock {
    constructor() {
        this.baseUrl = 'http://api.banco-teste.com';
    }
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
    mockProposalApproval(proposalId) {
        return nock(this.baseUrl)
            .patch(`/proposals/${proposalId}`)
            .reply(200, {
            id: proposalId,
            status: 'APPROVED',
        });
    }
    mockProposalRejection(proposalId, reason) {
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
};
exports.BankApiMock = BankApiMock;
exports.BankApiMock = BankApiMock = __decorate([
    (0, common_1.Injectable)()
], BankApiMock);
