import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
// import { Entity } from 'typeorm';
// @Entity('fluxo')
*/
export interface IFluxo {
  id: number;
  descricao: string;
  tipo: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Fluxo extends BaseEntity implements IFluxo {
  constructor(
    public id: number,
    public descricao: string,
    public tipo: string,
    public ativo: boolean = true
  ) {
    super();
  }
} 