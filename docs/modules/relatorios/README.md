# Módulo de Relatórios

## Visão Geral
O módulo de Relatórios permite a geração e gerenciamento de relatórios personalizados no sistema Consignaldo. Suporta múltiplos formatos (PDF, Excel, CSV) e tipos de relatório (Contratos, Margem, etc), com templates customizáveis.

## Funcionalidades

### Templates
- Criação e gerenciamento de templates personalizados
- Suporte a variáveis dinâmicas
- Layouts pré-definidos por tipo de relatório
- Controle de versão de templates

### Geração de Relatórios
- Geração assíncrona para melhor performance
- Cache de relatórios frequentes
- Múltiplos formatos de saída
- Filtros customizáveis por tipo

### Tipos de Relatório
1. **Contratos**
   - Análise de contratos por período
   - Resumo por banco/produto
   - Estatísticas de valores e prazos
   - Status de processamento

2. **Margem**
   - Análise de margem por órgão
   - Margem total vs disponível
   - Quantidade de contratos
   - Histórico de atualizações

## Arquitetura

### Componentes
```
src/
├── controllers/
│   └── relatorios.controller.ts
├── services/
│   └── relatorios/
│       ├── relatorios.service.ts
│       └── geradores/
│           ├── base.generator.ts
│           ├── contratos.generator.ts
│           └── margem.generator.ts
├── repositories/
│   └── relatorios.repository.ts
└── domain/
    └── relatorios/
        └── relatorios.types.ts
```

### Fluxo de Dados
1. Cliente solicita geração de relatório
2. Sistema valida template e filtros
3. Inicia geração assíncrona
4. Busca dados necessários
5. Aplica template e formatação
6. Gera arquivo no formato solicitado
7. Armazena no storage
8. Notifica conclusão

## Uso

### Endpoints

#### Templates
```typescript
// Criar template
POST /relatorios/templates
{
  "nome": "Template Contratos",
  "tipo": "CONTRATOS",
  "formato": "PDF",
  "layout": "layout personalizado"
}

// Listar templates
GET /relatorios/templates?tipo=CONTRATOS

// Atualizar template
PUT /relatorios/templates/:id
{
  "nome": "Novo Nome",
  "layout": "novo layout"
}
```

#### Relatórios
```typescript
// Gerar relatório
POST /relatorios/gerar
{
  "templateId": "uuid",
  "formato": "PDF",
  "filtros": {
    "dataInicio": "2025-01-01",
    "dataFim": "2025-12-31",
    "banco": "uuid"
  }
}

// Buscar relatório
GET /relatorios/:id

// Listar relatórios
GET /relatorios?pagina=1&itensPorPagina=10
```

### Exemplos de Uso

#### Geração de Relatório de Contratos
```typescript
const response = await api.post('/relatorios/gerar', {
  templateId: 'template-uuid',
  formato: 'PDF',
  filtros: {
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31',
    banco: 'banco-uuid',
    status: ['APROVADO', 'LIBERADO']
  }
});

// Aguardar conclusão
const relatorio = await api.get(`/relatorios/${response.data.id}`);
```

## Segurança

### Controle de Acesso
- `ADMIN`: Acesso total (CRUD templates e relatórios)
- `GESTOR`: Visualização de templates e geração/visualização de relatórios

### Validações
- Validação de templates existentes
- Validação de formatos suportados
- Sanitização de dados de entrada
- Validação de permissões por perfil

## Performance

### Otimizações
- Geração assíncrona de relatórios
- Cache de relatórios frequentes
- Paginação na listagem
- Compressão de arquivos grandes

### Limites
- Máximo de 10.000 registros por relatório
- Cache válido por 1 hora
- Timeout de geração: 5 minutos
- Tamanho máximo: 50MB

## Monitoramento

### Métricas
- Tempo médio de geração
- Taxa de uso do cache
- Erros por tipo
- Uso de storage

### Logs
- Início e fim de geração
- Erros durante processamento
- Acesso a relatórios
- Alterações em templates

## Testes

### Unitários
```bash
# Executar testes unitários
npm run test:unit src/__tests__/unit/relatorios

# Cobertura
npm run test:cov src/__tests__/unit/relatorios
```

### Integração
```bash
# Executar testes E2E
npm run test:e2e src/__tests__/integration/relatorios

# Ambiente de teste
npm run test:e2e:watch
```
