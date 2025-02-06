import { LoadTest, check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up para 50 usuários
    { duration: '3m', target: 50 },   // Mantém 50 usuários
    { duration: '1m', target: 100 },  // Ramp up para 100
    { duration: '3m', target: 100 },  // Mantém 100 usuários
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições < 500ms
    errors: ['rate<0.1'],             // Taxa de erro < 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = {
    servidorId: 1,
    consignatariaId: 1,
    valorSolicitado: 10000,
    prazo: 24,
  };

  // Simulação de empréstimo
  const simResponse = http.post(
    `${BASE_URL}/loan-simulation/simulate`,
    JSON.stringify(payload),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  check(simResponse, {
    'status 201': (r) => r.status === 201,
    'tempo resposta < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  if (simResponse.status === 201) {
    const simulacao = JSON.parse(simResponse.body);

    // Criação de proposta
    const propResponse = http.post(
      `${BASE_URL}/proposal`,
      JSON.stringify({
        simulacaoId: simulacao.id,
        servidorId: payload.servidorId,
        consignatariaId: payload.consignatariaId,
        valorSolicitado: simulacao.valorSolicitado,
        prazo: simulacao.prazo,
        valorParcela: simulacao.valorParcela,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    check(propResponse, {
      'status 201': (r) => r.status === 201,
      'tempo resposta < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  }

  sleep(1);
}
