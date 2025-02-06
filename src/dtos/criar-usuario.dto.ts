/**
 * DTO para criação de Usuário.
 */
export interface CriarUsuarioDto {
  pessoaId: number;
  login: string;
  senha: string;
  situacao: string;
} 