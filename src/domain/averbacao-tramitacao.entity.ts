import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa a tramitação de uma averbação
 */
export interface IAverbacaoTramitacao extends IBaseEntity {
  averbacaoId: number;
  usuarioId: number;
  data: Date;
  situacao: number;
  observacao?: string;
}

/**
 * Classe que encapsula os dados de Tramitação de Averbação
 */
export class AverbacaoTramitacao implements IAverbacaoTramitacao {
  constructor(
    public id: number,
    public averbacaoId: number,
    public usuarioId: number,
    public data: Date,
    public situacao: number,
    public observacao?: string,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
} 