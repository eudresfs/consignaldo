import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa uma importação de averbação
 */
export interface IAverbacaoImportacao extends IBaseEntity {
  caminhoArquivo: string;
  status: string;
}

/**
 * Classe que encapsula os dados da Importação de Averbação
 */
export class AverbacaoImportacao implements IAverbacaoImportacao {
  constructor(
    public id: number,
    public caminhoArquivo: string,
    public status: string,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
} 