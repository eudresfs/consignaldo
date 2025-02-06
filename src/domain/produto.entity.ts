import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade de Produto
 */
export interface IProduto extends IBaseEntity {
  nome: string;
  descricao: string;
  preco: number;
}

/**
 * Classe que encapsula os dados de um Produto.
 */
export class Produto implements IProduto {
  constructor(
    public id: number,
    public nome: string,
    public descricao: string,
    public preco: number,
    public ativo: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
} 