"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const business_rules_interface_1 = require("../../../domain/rules/business-rules.interface");
const enums_1 = require("../../../domain/enums");
const business_error_1 = require("../../../domain/errors/business.error");
describe('BusinessRules', () => {
    let rules;
    beforeEach(() => {
        rules = new business_rules_interface_1.BusinessRules();
    });
    describe('validateMargem', () => {
        it('should not throw when parcela is within margem maxima', () => {
            const salario = 1000;
            const parcela = 300; // 30% de 1000
            expect(() => rules.validateMargem(parcela, salario)).not.toThrow();
        });
        it('should throw MargemInsuficienteError when parcela exceeds margem maxima', () => {
            const salario = 1000;
            const parcela = 301; // 30.1% de 1000
            expect(() => rules.validateMargem(parcela, salario)).toThrow(business_error_1.MargemInsuficienteError);
        });
    });
    describe('validatePrazo', () => {
        it('should not throw for prazo determinado within limits', () => {
            expect(() => rules.validatePrazo(96, enums_1.ProdutoTipo.PRAZO_DETERMINADO_PARCELA_FIXA)).not.toThrow();
            expect(() => rules.validatePrazo(1, enums_1.ProdutoTipo.PRAZO_DETERMINADO_PARCELA_FIXA)).not.toThrow();
        });
        it('should throw PrazoInvalidoError for prazo determinado outside limits', () => {
            expect(() => rules.validatePrazo(97, enums_1.ProdutoTipo.PRAZO_DETERMINADO_PARCELA_FIXA)).toThrow(business_error_1.PrazoInvalidoError);
            expect(() => rules.validatePrazo(0, enums_1.ProdutoTipo.PRAZO_DETERMINADO_PARCELA_FIXA)).toThrow(business_error_1.PrazoInvalidoError);
        });
        it('should not throw for prazo indeterminado', () => {
            expect(() => rules.validatePrazo(999, enums_1.ProdutoTipo.PRAZO_INDETERMINADO_PARCELA_FIXA)).not.toThrow();
            expect(() => rules.validatePrazo(999, enums_1.ProdutoTipo.PRAZO_INDETERMINADO_PARCELA_VARIAVEL)).not.toThrow();
        });
    });
    describe('validateDiaCorte', () => {
        it('should not throw for valid dias de corte', () => {
            expect(() => rules.validateDiaCorte(new Date(2025, 1, 1))).not.toThrow();
            expect(() => rules.validateDiaCorte(new Date(2025, 1, 15))).not.toThrow();
            expect(() => rules.validateDiaCorte(new Date(2025, 1, 31))).not.toThrow();
        });
        it('should throw DiaCorteInvalidoError for invalid dias de corte', () => {
            const invalidDate = new Date(2025, 1, 32);
            expect(() => rules.validateDiaCorte(invalidDate)).toThrow(business_error_1.DiaCorteInvalidoError);
        });
    });
});
