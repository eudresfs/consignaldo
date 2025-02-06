/**
 * Tipos de relatórios disponíveis no sistema
 */
export enum ReportType {
  FOLHA_PAGAMENTO = 'FOLHA_PAGAMENTO',       // Relatório de folha de pagamento
  MARGEM = 'MARGEM',                         // Relatório de margens por servidor
  AVERBACAO = 'AVERBACAO',                   // Relatório de averbações
  CONTRATO = 'CONTRATO',                     // Relatório de contratos
  REPASSE = 'REPASSE',                       // Relatório de repasses
  CONCILIACAO = 'CONCILIACAO',               // Relatório de conciliação
  AUDITORIA = 'AUDITORIA',                   // Relatório de auditoria
}
