"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
exports.setup = setup;
exports.default = default_1;
exports.teardown = teardown;
const k6_1 = require("k6");
const http_1 = __importDefault(require("k6/http"));
exports.options = {
    scenarios: {
        average_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 50 }, // Rampa até 50 usuários em 1 minuto
                { duration: '3m', target: 50 }, // Mantém 50 usuários por 3 minutos
                { duration: '1m', target: 0 }, // Reduz para 0 em 1 minuto
            ],
            gracefulRampDown: '30s',
        },
        stress_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 100 }, // Rampa até 100 usuários em 2 minutos
                { duration: '5m', target: 100 }, // Mantém 100 usuários por 5 minutos
                { duration: '2m', target: 0 }, // Reduz para 0 em 2 minutos
            ],
            gracefulRampDown: '30s',
        },
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 200 }, // Pico rápido de 200 usuários
                { duration: '1m', target: 200 }, // Mantém por 1 minuto
                { duration: '30s', target: 0 }, // Reduz rapidamente
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% das requisições devem responder em menos de 500ms
        http_req_failed: ['rate<0.01'], // Menos de 1% de falhas
    },
};
const BASE_URL = 'http://localhost:3000/api';
function setup() {
    // Criar dados de teste
    const loginRes = http_1.default.post(`${BASE_URL}/auth/login`, {
        username: 'admin',
        password: 'admin',
    });
    const token = loginRes.json('token');
    // Criar servidor e contrato para testes
    const servidor = http_1.default.post(`${BASE_URL}/servidores`, {
        nome: 'Servidor Teste',
        cpf: '12345678900',
        matricula: '123456',
        salarioBruto: 5000,
        margemDisponivel: 1500,
    }, {
        headers: { Authorization: `Bearer ${token}` },
    }).json();
    return { token, servidorId: servidor.id };
}
function default_1(data) {
    const headers = {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json',
    };
    // Teste 1: Simulação de Novo Empréstimo
    const simpleSimulation = http_1.default.post(`${BASE_URL}/loan-simulation`, JSON.stringify({
        servidorId: data.servidorId,
        valorSolicitado: 10000,
        prazo: 24,
    }), { headers });
    (0, k6_1.check)(simpleSimulation, {
        'status 201': (r) => r.status === 201,
        'tem valor parcela': (r) => r.json('valorParcela') !== undefined,
        'parcela <= 1500': (r) => r.json('valorParcela') <= 1500,
    });
    // Teste 2: Simulação com Diferentes Prazos
    const prazos = [12, 24, 36, 48, 60];
    prazos.forEach(prazo => {
        const multiTermSimulation = http_1.default.post(`${BASE_URL}/loan-simulation`, JSON.stringify({
            servidorId: data.servidorId,
            valorSolicitado: 10000,
            prazo,
        }), { headers });
        (0, k6_1.check)(multiTermSimulation, {
            'status 201': (r) => r.status === 201,
            'prazo correto': (r) => r.json('prazo') === prazo,
        });
    });
    // Teste 3: Simulações Concorrentes
    const requests = [];
    for (let i = 0; i < 5; i++) {
        requests.push(['POST', `${BASE_URL}/loan-simulation`, JSON.stringify({
                servidorId: data.servidorId,
                valorSolicitado: 10000 + (i * 1000),
                prazo: 24,
            }), { headers }]);
    }
    const responses = http_1.default.batch(requests);
    responses.forEach((res, index) => {
        (0, k6_1.check)(res, {
            'status 201': (r) => r.status === 201,
            'valor correto': (r) => r.json('valorSolicitado') === 10000 + (index * 1000),
        });
    });
}
function teardown(data) {
    // Limpar dados de teste
    const headers = {
        'Authorization': `Bearer ${data.token}`,
    };
    http_1.default.del(`${BASE_URL}/servidores/${data.servidorId}`, null, { headers });
}
