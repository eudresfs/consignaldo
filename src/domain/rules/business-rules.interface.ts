import { ProdutoTipo } from '../enums';
import { MargemInsuficienteError, PrazoInvalidoError, DiaCorteInvalidoError } from '../errors/business.error';

export interface IBusinessRules {
  readonly MARGEM_MAXIMA: number;
  
  validateMargem(parcela: number, salario: number): void;
  validatePrazo(meses: number, produto: ProdutoTipo): void;
  validateDiaCorte(data: Date): void;
}

export class BusinessRules implements IBusinessRules {
  public readonly MARGEM_MAXIMA = 0.3;

  public validateMargem(parcela: number, salario: number): void {
    const margemMaxima = salario * this.MARGEM_MAXIMA;
    if (parcela > margemMaxima) {
      throw new MargemInsuficienteError({
        margem: margemMaxima,
        parcela
      });
    }
  }

  public validatePrazo(meses: number, produto: ProdutoTipo): void {
    let valido = true;
    
    switch (produto) {
      case ProdutoTipo.PRAZO_DETERMINADO_PARCELA_FIXA:
        valido = meses > 0 && meses <= 96;
        break;
      case ProdutoTipo.PRAZO_INDETERMINADO_PARCELA_FIXA:
      case ProdutoTipo.PRAZO_INDETERMINADO_PARCELA_VARIAVEL:
        valido = true;
        break;
      default:
        valido = false;
    }

    if (!valido) {
      throw new PrazoInvalidoError({
        meses,
        produto: ProdutoTipo[produto]
      });
    }
  }

  public validateDiaCorte(data: Date): void {
    const dia = data.getDate();
    if (dia < 1 || dia > 31) {
      throw new DiaCorteInvalidoError({ data });
    }
  }
}
