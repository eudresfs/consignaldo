import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
// import { Entity } from 'typeorm';
// @Entity('permissao')
*/
export interface IPermissao {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Permissao extends BaseEntity implements IPermissao {
  constructor(
    public id: number,
    public nome: string,
    public ativo: boolean = true,
    public descricao: string = ''
  ) {
    super();
  }
} 