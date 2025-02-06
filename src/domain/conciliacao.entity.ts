import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
// import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
// @Entity('conciliacao')
*/
export interface IConciliacao {
  id: number;
  dataConciliacao: Date;
  status: string;
  valor?: number;
  observacao?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Conciliacao extends BaseEntity implements IConciliacao {
  constructor(
    public id: number,
    public dataConciliacao: Date,
    public status: string,
    public ativo: boolean = true,
    public valor: number = 0,
    public observacao: string = ''
  ) {
    super();
  }
} 