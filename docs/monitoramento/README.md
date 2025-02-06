# Consignaldo

Sistema de gestão de consignações desenvolvido em Node.js/TypeScript.

## 🚀 Funcionalidades

### Módulo de Segurança
- Autenticação JWT
- Controle de acesso baseado em papéis (RBAC)
- Rate limiting
- Proteção contra força bruta
- Logging estruturado

### Módulo de Integração
- Importação de folha de pagamento
- Consulta de margem
- Averbação de contratos
- Cache com Redis
- Processamento assíncrono

### Módulo de Relatórios
- Geração assíncrona
- Múltiplos formatos (PDF, Excel, CSV)
- Templates personalizáveis
- Agendamento automático
- Armazenamento em S3/local

### Módulo de Notificações
- Email, SMS, Push, WhatsApp
- Templates personalizáveis
- Retry com backoff
- Webhooks para integrações
- Agendamento

### Módulo de Auditoria
- Trilha completa de ações
- Mascaramento de dados sensíveis
- Estatísticas em tempo real
- Retenção configurável
- Busca avançada

## 🛠️ Tecnologias

- Node.js 18+
- TypeScript 4.9+
- NestJS 9+
- PostgreSQL 14+
- Redis 6+
- Bull (Filas)
- Prisma (ORM)
- Jest (Testes)
- AWS SDK

## 📋 Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- Redis 6 ou superior
- Yarn ou NPM

## 🔧 Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/consignaldo.git
cd consignaldo
```

2. Instale as dependências
```bash
yarn install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. Execute as migrações
```bash
yarn prisma migrate deploy
```

5. Inicie o servidor
```bash
# Desenvolvimento
yarn start:dev

# Produção
yarn build
yarn start:prod
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/consignaldo"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="sua-chave-secreta"
JWT_EXPIRES_IN="1d"

# AWS (opcional)
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_REGION="sa-east-1"
AWS_S3_BUCKET="seu-bucket"

# SMTP
SMTP_HOST="smtp.exemplo.com"
SMTP_PORT=587
SMTP_USER="seu-usuario"
SMTP_PASS="sua-senha"
SMTP_FROM="noreply@exemplo.com"

# Rate Limiting
RATE_LIMIT_POINTS=100
RATE_LIMIT_DURATION=60
```

### Papéis e Permissões

- ADMIN: Acesso total ao sistema
- GESTOR: Gerenciamento de consignações
- USUARIO: Operações básicas
- AUDITOR: Visualização de logs
- SISTEMA: Integrações automatizadas

## 📦 Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── services/        # Lógica de negócio
├── repositories/    # Acesso a dados
├── domain/         # Entidades e regras
│   ├── entities/
│   ├── enums/
│   └── interfaces/
├── infrastructure/ # Infraestrutura
│   ├── auth/
│   ├── cache/
│   ├── queue/
│   └── storage/
├── jobs/          # Processadores de fila
└── __tests__/     # Testes
```

## 🔍 API

A documentação completa da API está disponível em `/api/docs` (Swagger).

Principais endpoints:

### Autenticação
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### Consignações
- POST /averbacoes
- GET /averbacoes/:id
- PUT /averbacoes/:id
- DELETE /averbacoes/:id

### Relatórios
- POST /reports
- GET /reports/:id
- GET /reports/:id/download

### Notificações
- POST /notifications
- GET /notifications/templates
- POST /notifications/templates

### Auditoria
- GET /audit
- GET /audit/stats

## 🧪 Testes

```bash
# Testes unitários
yarn test

# Testes e2e
yarn test:e2e

# Cobertura
yarn test:cov
```

## 📈 Monitoramento

### Métricas Disponíveis

- Taxa de sucesso de integrações
- Tempo médio de processamento
- Uso de recursos (CPU, memória)
- Latência da API
- Status das filas

### Healthcheck

Endpoint: `/health`
```json
{
  "status": "UP",
  "services": {
    "database": { "status": "UP" },
    "redis": { "status": "UP" },
    "integrations": {
      "status": "UP",
      "details": { ... }
    }
  }
}
```

## Funcionalidades

### 1. Coleta de Métricas
- **Sistema**
  - CPU (uso e carga)
  - Memória (total, usado, livre)
  - Disco (espaço e I/O)
  - Processo (heap, RSS, uptime)

- **Aplicação**
  - Requisições HTTP (latência, erros)
  - Banco de dados (queries, erros)
  - Cache (hit rate, tamanho)

### 2. Tipos de Métricas
- **Contador**: Valores que só incrementam
- **Medidor**: Valores que sobem e descem
- **Histograma**: Distribuição de valores
- **Resumo**: Cálculo de percentis

### 3. Alertas
- **Tipos**
  - Threshold: Limite fixo
  - Anomalia: Desvio do padrão
  - Tendência: Crescimento/queda

- **Severidades**
  - Critical: Problema grave que requer ação imediata
  - Error: Erro que afeta funcionalidade
  - Warning: Situação que requer atenção
  - Info: Informação relevante

### 4. Dashboard
- Resumo geral do sistema
- Métricas-chave em tempo real
- Histórico de alertas
- Gráficos e tendências

## API REST

### Métricas
```typescript
// Lista métricas com filtros
GET /metricas
Query: {
  nome?: string;
  inicio?: Date;
  fim?: Date;
  tag?: string;
  limite?: number;
}

// Busca métrica por nome
GET /metricas/:nome

// Histórico de valores
GET /metricas/:nome/historico
Query: {
  inicio: Date;
  fim: Date;
}
```

### Regras de Alerta
```typescript
// Lista regras
GET /regras

// Cria regra
POST /regras
Body: {
  nome: string;
  descricao: string;
  tipo: TipoAlerta;
  metricaNome: string;
  severidade: SeveridadeAlerta;
  condicao: string;
  intervalo: number;
  notificar: string[];
}

// Atualiza regra
PUT /regras/:id
Body: Partial<CreateRegraAlertaDto>

// Remove regra
DELETE /regras/:id
```

### Alertas
```typescript
// Lista alertas
GET /alertas
Query: {
  regraId?: string;
  severidade?: SeveridadeAlerta;
  inicio?: Date;
  fim?: Date;
  limite?: number;
}

// Busca alerta
GET /alertas/:id

// Resolve alerta
PUT /alertas/:id/resolver
Body: {
  observacao?: string;
}
```

### Dashboard
```typescript
// Resumo geral
GET /dashboard/resumo

// Métricas-chave
GET /dashboard/metricas-chave

// Alertas recentes
GET /dashboard/alertas-recentes
Query: {
  limite?: number;
}
```

## Configuração

### 1. Variáveis de Ambiente
```env
# Coleta de métricas
METRICS_COLLECTION_INTERVAL=60000  # ms
METRICS_RETENTION_DAYS=30

# Alertas
ALERT_CHECK_INTERVAL=300000  # ms
ALERT_NOTIFICATION_CHANNELS=["email", "slack"]
```

### 2. Regras Padrão
O sistema vem com regras pré-configuradas para:
- CPU > 80% (warning) e > 95% (critical)
- Memória > 85% (warning) e > 95% (critical)
- Disco > 85% (warning) e > 95% (critical)
- Latência > 2σ (warning)
- Erros > 5% (error)

## Segurança
- Endpoints protegidos por JWT
- RBAC com roles ADMIN e MONITOR
- Rate limiting nas APIs
- Validação de inputs com class-validator

## Testes
```bash
# Testes unitários
npm run test:unit monitoramento

# Testes de integração
npm run test:e2e monitoramento

# Cobertura
npm run test:cov monitoramento
```

## 🔒 Segurança

- Todas as senhas são hasheadas com bcrypt
- Tokens JWT com rotação
- Rate limiting por IP/usuário
- Proteção contra XSS e CSRF
- Validação de entrada com class-validator
- Sanitização de saída
- Logs estruturados com winston

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Consulte a [documentação](docs/)
2. Abra uma [issue](issues/new)
3. Entre em contato com o suporte: [email](mailto:suporte@consignaldo.com)
