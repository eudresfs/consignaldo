"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditResource = void 0;
/**
 * Recursos que podem ser auditados no sistema
 */
var AuditResource;
(function (AuditResource) {
    // Entidades Principais
    AuditResource["USUARIO"] = "USUARIO";
    AuditResource["SERVIDOR"] = "SERVIDOR";
    AuditResource["CONSIGNANTE"] = "CONSIGNANTE";
    AuditResource["CONSIGNATARIA"] = "CONSIGNATARIA";
    AuditResource["CONTRATO"] = "CONTRATO";
    AuditResource["MARGEM"] = "MARGEM";
    AuditResource["FOLHA_PAGAMENTO"] = "FOLHA_PAGAMENTO";
    // Configurações
    AuditResource["ROLE"] = "ROLE";
    AuditResource["PERMISSION"] = "PERMISSION";
    AuditResource["INTEGRATION"] = "INTEGRATION";
    AuditResource["NOTIFICATION"] = "NOTIFICATION";
    AuditResource["REPORT"] = "REPORT";
    // Sistema
    AuditResource["SYSTEM"] = "SYSTEM";
    AuditResource["AUTH"] = "AUTH";
    AuditResource["API"] = "API";
})(AuditResource || (exports.AuditResource = AuditResource = {}));
