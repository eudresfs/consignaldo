/**
 * Recursos que podem ser auditados no sistema
 */
export enum AuditResource {
  // Entidades Principais
  USUARIO = 'USUARIO',
  SERVIDOR = 'SERVIDOR',
  CONSIGNANTE = 'CONSIGNANTE',
  CONSIGNATARIA = 'CONSIGNATARIA',
  CONTRATO = 'CONTRATO',
  MARGEM = 'MARGEM',
  FOLHA_PAGAMENTO = 'FOLHA_PAGAMENTO',

  // Configurações
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  INTEGRATION = 'INTEGRATION',
  NOTIFICATION = 'NOTIFICATION',
  REPORT = 'REPORT',

  // Sistema
  SYSTEM = 'SYSTEM',
  AUTH = 'AUTH',
  API = 'API',
}
