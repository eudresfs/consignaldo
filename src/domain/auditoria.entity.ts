import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
   // import { Entity, Column } from 'typeorm';
   // @Entity('auditoria')
*/

export interface IAuditoria {
  id: number;
  data: Date;
  descricao: string;
  usuarioId: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Auditoria extends BaseEntity implements IAuditoria {
  constructor(
    public id: number,
    public data: Date,
    public descricao: string,
    public usuarioId: number,
    public ativo: boolean = true
  ) {
    super();
  }
} 