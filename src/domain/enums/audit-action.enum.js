"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = void 0;
/**
 * Ações que podem ser auditadas no sistema
 */
var AuditAction;
(function (AuditAction) {
    // Ações CRUD
    AuditAction["CREATE"] = "CREATE";
    AuditAction["READ"] = "READ";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["RESTORE"] = "RESTORE";
    // Ações de Sistema
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["FAILED_LOGIN"] = "FAILED_LOGIN";
    AuditAction["PASSWORD_RESET"] = "PASSWORD_RESET";
    AuditAction["EXPORT"] = "EXPORT";
    AuditAction["IMPORT"] = "IMPORT";
    // Ações de Negócio
    AuditAction["AVERBACAO"] = "AVERBACAO";
    AuditAction["MARGEM_BLOQUEIO"] = "MARGEM_BLOQUEIO";
    AuditAction["MARGEM_LIBERACAO"] = "MARGEM_LIBERACAO";
    AuditAction["CONTRATO_LIQUIDACAO"] = "CONTRATO_LIQUIDACAO";
    AuditAction["CONTRATO_FINALIZACAO"] = "CONTRATO_FINALIZACAO";
    // Ações de Configuração
    AuditAction["CONFIG_UPDATE"] = "CONFIG_UPDATE";
    AuditAction["PERMISSION_UPDATE"] = "PERMISSION_UPDATE";
    AuditAction["INTEGRATION_UPDATE"] = "INTEGRATION_UPDATE";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
