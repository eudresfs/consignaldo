/**
 * Tipos de integração suportados pelo sistema
 */
export enum IntegrationType {
  FOLHA_PAGAMENTO = 'FOLHA_PAGAMENTO',    // Importação de folha de pagamento
  MARGEM = 'MARGEM',                      // Consulta de margem
  AVERBACAO = 'AVERBACAO',                // Averbação de contratos
  RETORNO_BANCO = 'RETORNO_BANCO',        // Retorno bancário
  SERVIDOR = 'SERVIDOR'                    // Dados do servidor
}
