/**
 * Entidade de Usuário
 */
export interface IUsuario {
  id: number;
  pessoaId: number;
  login: string;
  senha: string;
  situacao: string;
  ultimoAcesso?: Date;
  ativo: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

/**
 * Classe que encapsula os dados de um Usuário.
 */
export class Usuario implements IUsuario {
  constructor(
    public id: number,
    public pessoaId: number,
    public login: string,
    public senha: string,
    public situacao: string,
    public ultimoAcesso: Date | undefined,
    public ativo: boolean,
    public criadoEm?: Date,
    public atualizadoEm?: Date
  ) {}
} 