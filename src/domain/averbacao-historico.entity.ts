import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa o histórico de uma averbação
 */
export interface IAverbacaoHistorico extends IBaseEntity {
  averbacaoId: number;
  descricao: string;
}

/**
 * Classe que encapsula os dados do Histórico de Averbação
 */
export class AverbacaoHistorico implements IAverbacaoHistorico {
  constructor(
    public id: number,
    public averbacaoId: number,
    public descricao: string,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
} 