import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
// import { Entity } from 'typeorm';
// @Entity('funcionario')
*/
export interface IFuncionario {
  id: number;
  nome: string;
  cpf: string;
  email?: string;
  dataAdmissao: Date;
  cargo?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Funcionario extends BaseEntity implements IFuncionario {
  constructor(
    public id: number,
    public nome: string,
    public cpf: string,
    public dataAdmissao: Date,
    public ativo: boolean = true,
    public email: string = '',
    public cargo: string = ''
  ) {
    super();
  }
} 