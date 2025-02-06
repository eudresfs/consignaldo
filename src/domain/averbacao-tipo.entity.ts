import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa o tipo de uma averbação
 */
export interface IAverbacaoTipo extends IBaseEntity {
  descricao: string;
  sigla: string;
  prazo: number;
  valorMinimo: number;
  valorMaximo: number;
}

/**
 * Classe que encapsula os dados de um Tipo de Averbação
 */
export class AverbacaoTipo implements IAverbacaoTipo {
  constructor(
    public id: number,
    public descricao: string,
    public sigla: string,
    public prazo: number,
    public valorMinimo: number,
    public valorMaximo: number,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}