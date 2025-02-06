"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRules = void 0;
const enums_1 = require("../enums");
const business_error_1 = require("../errors/business.error");
class BusinessRules {
    constructor() {
        this.MARGEM_MAXIMA = 0.3;
    }
    validateMargem(parcela, salario) {
        const margemMaxima = salario * this.MARGEM_MAXIMA;
        if (parcela > margemMaxima) {
            throw new business_error_1.MargemInsuficienteError({
                margem: margemMaxima,
                parcela
            });
        }
    }
    validatePrazo(meses, produto) {
        let valido = true;
        switch (produto) {
            case enums_1.ProdutoTipo.PRAZO_DETERMINADO_PARCELA_FIXA:
                valido = meses > 0 && meses <= 96;
                break;
            case enums_1.ProdutoTipo.PRAZO_INDETERMINADO_PARCELA_FIXA:
            case enums_1.ProdutoTipo.PRAZO_INDETERMINADO_PARCELA_VARIAVEL:
                valido = true;
                break;
            default:
                valido = false;
        }
        if (!valido) {
            throw new business_error_1.PrazoInvalidoError({
                meses,
                produto: enums_1.ProdutoTipo[produto]
            });
        }
    }
    validateDiaCorte(data) {
        const dia = data.getDate();
        if (dia < 1 || dia > 31) {
            throw new business_error_1.DiaCorteInvalidoError({ data });
        }
    }
}
exports.BusinessRules = BusinessRules;
