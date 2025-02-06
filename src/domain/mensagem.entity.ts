import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
// import { Entity } from 'typeorm';
// @Entity('mensagem')
*/
export interface IMensagem {
  id: number;
  titulo: string;
  conteudo: string;
  dataEnvio: Date;
  remetente?: string;
  destinatario?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Mensagem extends BaseEntity implements IMensagem {
  constructor(
    public id: number,
    public titulo: string,
    public conteudo: string,
    public dataEnvio: Date,
    public ativo: boolean = true,
    public remetente: string = '',
    public destinatario: string = ''
  ) {
    super();
  }
} 