import { BaseEntity } from './base.entity';
import { IsDate, IsEnum, IsNumber, IsBoolean } from 'class-validator';

// Mover o enum para antes do uso dos decoradores
export enum AverbacaoStatus {
  AGUARDANDO_APROVACAO = 'AGUARDANDO_APROVACAO',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  CANCELADO = 'CANCELADO'
}

/**
 * Entidade que representa uma Averbação.
 */
export interface IAverbacao {
  id: number;
  dataAverbacao: Date;
  status: AverbacaoStatus;
  valorTotal: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Classe que encapsula os dados de uma Averbação.
 */
export class Averbacao extends BaseEntity implements IAverbacao {
  @IsNumber()
  id!: number;

  @IsDate()
  dataAverbacao!: Date;

  @IsEnum(AverbacaoStatus)
  status!: AverbacaoStatus;

  @IsNumber()
  valorTotal!: number;

  @IsBoolean()
  ativo!: boolean;

  constructor(
    id: number,
    dataAverbacao: Date,
    status: AverbacaoStatus,
    valorTotal: number,
    ativo: boolean = true
  ) {
    super();
    this.id = id;
    this.dataAverbacao = dataAverbacao;
    this.status = status;
    this.valorTotal = valorTotal;
    this.ativo = ativo;
  }
} 