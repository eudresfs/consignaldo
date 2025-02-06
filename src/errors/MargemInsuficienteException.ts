export class MargemInsuficienteException extends Error {
  public details: any;
  constructor(details: any) {
    super('Margem insuficiente');
    this.details = details;
  }
} 