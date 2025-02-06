/**
 * Classe base para todas as entidades.
 */
export abstract class BaseEntity {
  createdAt: Date;
  updatedAt: Date;

  constructor() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
} 