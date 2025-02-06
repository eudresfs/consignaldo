import { BaseEntity } from './base.entity';

/**
 * Entidade de Acesso ao Vídeo
 */
export interface IAcessoVideo {
  id: number;
  usuarioId: number;
  videoId: number;
  data: Date;
  ip?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Classe que encapsula os dados de um AcessoVideo
 */
export class AcessoVideo extends BaseEntity implements IAcessoVideo {
  constructor(
    public id: number,
    public usuarioId: number,
    public videoId: number,
    public data: Date,
    public ip: string = '',
    public ativo: boolean = true
  ) {
    super();
  }
} 