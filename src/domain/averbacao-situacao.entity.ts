import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa a situação de uma averbação
 */
export interface IAverbacaoSituacao extends IBaseEntity {
  descricao: string;
}

/**
 * Classe que encapsula os dados de uma Situação de Averbação
 */
export class AverbacaoSituacao implements IAverbacaoSituacao {
  constructor(
    public id: number,
    public descricao: string,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
} 