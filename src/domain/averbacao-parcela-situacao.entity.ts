import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa a situação de uma parcela de averbação
 */
export interface IAverbacaoParcelaSituacao extends IBaseEntity {
  parcelaId: number;
  situacao: number;
  data: Date;
  observacao?: string;
}

/**
 * Classe que encapsula os dados da Situação de Parcela
 */
export class AverbacaoParcelaSituacao implements IAverbacaoParcelaSituacao {
  constructor(
    public id: number,
    public parcelaId: number,
    public situacao: number,
    public data: Date,
    public observacao?: string,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
} 