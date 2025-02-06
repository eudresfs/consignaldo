/**
 * DTO para criação de Funcionário.
 */
export interface CriarFuncionarioDto {
  pessoaId: number;
  empresaId: number;
  matricula: string;
  cargo?: string;
  setor?: string;
  situacao: number;
  margemBruta?: number;
  margemLiquida?: number;
} 