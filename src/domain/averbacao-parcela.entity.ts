import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa uma parcela de averbação
 */
export interface IAverbacaoParcela extends IBaseEntity {
  averbacaoId: number;
  valor: number;
  vencimento: Date;
}

/**
 * Classe que encapsula os dados de uma Parcela
 */
export class AverbacaoParcela implements IAverbacaoParcela {
  constructor(
    public id: number,
    public averbacaoId: number,
    public valor: number,
    public vencimento: Date,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
} 