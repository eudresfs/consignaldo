import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
// import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
// @Entity('empresa')
*/
export interface IEmpresa {
  id: number;
  nome: string;
  cnpj: string;
  endereco?: string;
  telefone?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Empresa extends BaseEntity implements IEmpresa {
  constructor(
    public id: number,
    public nome: string,
    public cnpj: string,
    public ativo: boolean = true,
    public endereco: string = '',
    public telefone: string = ''
  ) {
    super();
  }
} 