# API Documentation

## 🔑 Autenticação

### Login
```http
POST /auth/login
```

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": "number"
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": "number"
}
```

## 📋 Consignações

### Criar Averbação
```http
POST /averbacoes
```

**Request:**
```json
{
  "servidorId": "number",
  "consignatariaId": "number",
  "valorParcela": "number",
  "numeroParcelas": "number",
  "valorTotal": "number",
  "dataInicio": "date"
}
```

**Response:**
```json
{
  "id": "number",
  "status": "AGUARDANDO",
  "protocolo": "string",
  "criadoEm": "date"
}
```

### Buscar Averbação
```http
GET /averbacoes/{id}
```

**Response:**
```json
{
  "id": "number",
  "servidor": {
    "id": "number",
    "nome": "string",
    "matricula": "string"
  },
  "consignataria": {
    "id": "number",
    "nome": "string"
  },
  "valorParcela": "number",
  "numeroParcelas": "number",
  "valorTotal": "number",
  "status": "string",
  "protocolo": "string",
  "dataInicio": "date",
  "criadoEm": "date",
  "atualizadoEm": "date"
}
```

## 📊 Relatórios

### Gerar Relatório
```http
POST /reports
```

**Request:**
```json
{
  "tipo": "FOLHA_PAGAMENTO",
  "formato": "PDF",
  "filtros": {
    "dataInicio": "date",
    "dataFim": "date",
    "consignanteId": "number"
  }
}
```

**Response:**
```json
{
  "id": "string",
  "status": "PROCESSANDO",
  "criadoEm": "date"
}
```

### Download Relatório
```http
GET /reports/{id}/download
```

**Response:** Binary file

## 📬 Notificações

### Enviar Notificação
```http
POST /notifications
```

**Request:**
```json
{
  "evento": "CONTRATO_AVERBADO",
  "dados": {
    "contratoId": "number",
    "servidor": {
      "nome": "string",
      "email": "string"
    }
  },
  "destinatarios": ["string"]
}
```

**Response:**
```json
{
  "id": "string",
  "status": "ENVIADO",
  "enviadoEm": "date"
}
```

## 📝 Auditoria

### Buscar Eventos
```http
GET /audit
```

**Query Parameters:**
- startDate: date
- endDate: date
- action: string
- resource: string
- userId: number
- status: "SUCCESS" | "ERROR"

**Response:**
```json
[
  {
    "id": "string",
    "timestamp": "date",
    "action": "string",
    "resource": "string",
    "userId": "number",
    "username": "string",
    "status": "string"
  }
]
```

## 🏥 Health Check

### Status do Sistema
```http
GET /health
```

**Response:**
```json
{
  "status": "UP",
  "timestamp": "date",
  "services": {
    "database": {
      "status": "UP"
    },
    "redis": {
      "status": "UP"
    },
    "integrations": {
      "status": "UP",
      "services": [
        {
          "name": "string",
          "status": "UP",
          "lastCheck": "date"
        }
      ]
    }
  }
}
```

## ⚠️ Erros

### Formato de Erro
```json
{
  "statusCode": "number",
  "message": "string",
  "error": "string",
  "details": [
    {
      "field": "string",
      "message": "string"
    }
  ],
  "timestamp": "date",
  "path": "string"
}
```

### Códigos de Erro
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error

## 🔒 Segurança

### Headers Obrigatórios
```http
Authorization: Bearer {token}
Content-Type: application/json
```

### Rate Limiting
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1612345678
```

## 📦 Modelos

### Servidor
```json
{
  "id": "number",
  "nome": "string",
  "matricula": "string",
  "cpf": "string",
  "email": "string",
  "telefone": "string",
  "ativo": "boolean",
  "vinculo": {
    "id": "number",
    "cargo": "string",
    "orgao": "string",
    "dataAdmissao": "date"
  }
}
```

### Contrato
```json
{
  "id": "number",
  "servidor": {
    "id": "number",
    "nome": "string"
  },
  "consignataria": {
    "id": "number",
    "nome": "string"
  },
  "valorParcela": "number",
  "numeroParcelas": "number",
  "valorTotal": "number",
  "status": "string",
  "dataInicio": "date",
  "dataFim": "date",
  "parcelasRestantes": "number"
}
```

### Margem
```json
{
  "id": "number",
  "servidor": {
    "id": "number",
    "nome": "string"
  },
  "margemDisponivel": "number",
  "margemUtilizada": "number",
  "margemTotal": "number",
  "competencia": "string",
  "atualizadoEm": "date"
}
```
