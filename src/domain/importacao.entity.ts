import { BaseEntity } from './base.entity';

/* Se utilizar TypeORM, descomente os decorators abaixo:
// import { Entity } from 'typeorm';
// @Entity('importacao')
*/
export interface IImportacao {
  id: number;
  caminhoArquivo: string;
  status: string;
  dataImportacao: Date;
  mensagem?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Importacao extends BaseEntity implements IImportacao {
  constructor(
    public id: number,
    public caminhoArquivo: string,
    public status: string,
    public dataImportacao: Date,
    public ativo: boolean = true,
    public mensagem: string = ''
  ) {
    super();
  }
} 