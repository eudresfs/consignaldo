/**
 * Enum que define os papéis de usuário no sistema
 */
export enum Role {
  ADMIN = 'ADMIN',                    // Acesso total ao sistema
  GESTOR = 'GESTOR',                  // Gestão de usuários e configurações
  CONSIGNATARIA = 'CONSIGNATARIA',    // Usuário do banco
  CONSIGNANTE = 'CONSIGNANTE',        // Usuário do órgão público
  SERVIDOR = 'SERVIDOR',              // Servidor público
  OPERADOR = 'OPERADOR'              // Operador do sistema
}
