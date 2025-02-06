"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationType = void 0;
/**
 * Tipos de integração suportados pelo sistema
 */
var IntegrationType;
(function (IntegrationType) {
    IntegrationType["FOLHA_PAGAMENTO"] = "FOLHA_PAGAMENTO";
    IntegrationType["MARGEM"] = "MARGEM";
    IntegrationType["AVERBACAO"] = "AVERBACAO";
    IntegrationType["RETORNO_BANCO"] = "RETORNO_BANCO";
    IntegrationType["SERVIDOR"] = "SERVIDOR"; // Dados do servidor
})(IntegrationType || (exports.IntegrationType = IntegrationType = {}));
