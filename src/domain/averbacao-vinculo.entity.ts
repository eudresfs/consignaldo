import { IBaseEntity } from './interfaces/base.entity';

/**
 * Entidade que representa o vínculo entre averbações
 */
export interface IAverbacaoVinculo extends IBaseEntity {
  averbacaoId: number;
  averbacaoPaiId: number;
  tipo: number;
}

/**
 * Classe que encapsula os dados do Vínculo de Averbação
 */
export class AverbacaoVinculo implements IAverbacaoVinculo {
  constructor(
    public id: number,
    public averbacaoId: number,
    public averbacaoPaiId: number,
    public tipo: number,
    public ativo: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
} 