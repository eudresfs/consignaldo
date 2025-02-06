# Observabilidade

## Métricas

### HTTP
- `http_request_duration_seconds`: Duração das requisições HTTP
  - Labels: method, route, status_code
  - Alertas:
    - CRITICAL: p95 > 500ms por 5min
    - WARNING: p95 > 300ms por 5min

### Negócio
- `active_loans_total`: Total de empréstimos ativos
  - Labels: consignataria
  - Alertas:
    - WARNING: Queda > 20% em 1h
    - INFO: Aumento > 50% em 1h

- `loan_amount_reais`: Distribuição dos valores de empréstimo
  - Buckets: 5k, 10k, 15k, 20k, 30k, 50k
  - Alertas:
    - WARNING: Valor médio > 30k em 24h

### Erros
- `application_errors_total`: Total de erros
  - Labels: type, code
  - Alertas:
    - CRITICAL: > 100 erros/min
    - WARNING: > 50 erros/min

### Integrações
- `bank_integration_duration_seconds`: Duração das operações bancárias
  - Labels: bank, operation
  - Alertas:
    - CRITICAL: > 10s por operação
    - WARNING: > 5s por operação

## Logs

### Níveis
- ERROR: Erros que precisam de ação imediata
- WARN: Situações anormais mas não críticas
- INFO: Eventos importantes do negócio
- DEBUG: Informações detalhadas para troubleshooting

### Campos Obrigatórios
- timestamp
- level
- service
- context
- trace_id
- span_id

### Mascaramento
Dados sensíveis são automaticamente mascarados:
- CPF: ***.***.***-**
- Cartão: ****-****-****-****
- Senha: ********

## Tracing

### Spans Principais
- /loan-simulation
- /proposal
- /contract
- /bank-integration
- /payroll

### Atributos
- user_id
- operation_id
- business_unit
- error_code
- duration_ms

## Dashboards

### Performance
- Latência por endpoint
- Taxa de erros
- Throughput
- Recursos do sistema

### Negócio
- Empréstimos por status
- Valor médio por consignatária
- Taxa de aprovação
- SLA de processamento

### Integrações
- Disponibilidade dos bancos
- Tempo de resposta
- Taxa de sucesso
- Erros por tipo

## Alertas

### Configuração

```yaml
groups:
  - name: consignaldo
    rules:
      - alert: HighErrorRate
        expr: sum(rate(application_errors_total[5m])) > 100
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Alta taxa de erros"
          description: "Taxa de erros > 100/min por 5min"

      - alert: SlowRequests
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Requisições lentas"
          description: "p95 > 500ms por 5min"

      - alert: BankIntegrationDelay
        expr: histogram_quantile(0.95, sum(rate(bank_integration_duration_seconds_bucket[5m])) by (le)) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Atraso na integração bancária"
          description: "Operações > 10s"
```

## Troubleshooting

### Comandos Úteis

```bash
# Visualizar logs
kubectl logs -l app=consignaldo -n production | grep ERROR

# Verificar métricas
curl localhost:9090/metrics | grep consignaldo

# Trace específico
curl localhost:16686/api/traces/{trace_id}
```

### Procedimentos

1. **Erro em Produção**
   - Verificar logs no Elasticsearch
   - Analisar trace completo no Jaeger
   - Verificar métricas relacionadas
   - Identificar padrões nos dashboards

2. **Performance Degradada**
   - Verificar latência por endpoint
   - Analisar uso de recursos
   - Verificar integrações lentas
   - Revisar queries do banco

3. **Problemas de Integração**
   - Verificar status do banco
   - Analisar logs de erro
   - Verificar tempo de resposta
   - Validar payload/response
