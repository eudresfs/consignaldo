"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
exports.default = default_1;
const k6_1 = require("k6");
const http_1 = __importDefault(require("k6/http"));
const metrics_1 = require("k6/metrics");
const errorRate = new metrics_1.Rate('errors');
exports.options = {
    stages: [
        { duration: '1m', target: 50 }, // Ramp up para 50 usuários
        { duration: '3m', target: 50 }, // Mantém 50 usuários
        { duration: '1m', target: 100 }, // Ramp up para 100
        { duration: '3m', target: 100 }, // Mantém 100 usuários
        { duration: '1m', target: 0 }, // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% das requisições < 500ms
        errors: ['rate<0.1'], // Taxa de erro < 10%
    },
};
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
function default_1() {
    const payload = {
        servidorId: 1,
        consignatariaId: 1,
        valorSolicitado: 10000,
        prazo: 24,
    };
    // Simulação de empréstimo
    const simResponse = http_1.default.post(`${BASE_URL}/loan-simulation/simulate`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
    });
    (0, k6_1.check)(simResponse, {
        'status 201': (r) => r.status === 201,
        'tempo resposta < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
    (0, k6_1.sleep)(1);
    if (simResponse.status === 201) {
        const simulacao = JSON.parse(simResponse.body);
        // Criação de proposta
        const propResponse = http_1.default.post(`${BASE_URL}/proposal`, JSON.stringify({
            simulacaoId: simulacao.id,
            servidorId: payload.servidorId,
            consignatariaId: payload.consignatariaId,
            valorSolicitado: simulacao.valorSolicitado,
            prazo: simulacao.prazo,
            valorParcela: simulacao.valorParcela,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
        (0, k6_1.check)(propResponse, {
            'status 201': (r) => r.status === 201,
            'tempo resposta < 500ms': (r) => r.timings.duration < 500,
        }) || errorRate.add(1);
    }
    (0, k6_1.sleep)(1);
}
