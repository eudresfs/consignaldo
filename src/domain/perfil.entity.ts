import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade de Perfil
 */
export interface IPerfil extends IBaseEntity {
  nome: string;
  descricao: string;
}

/**
 * Classe que encapsula os dados de um Perfil.
 */
export class Perfil implements IPerfil {
  constructor(
    public id: number,
    public nome: string,
    public descricao: string,
    public ativo: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
} 