"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
/**
 * Enum que define os papéis de usuário no sistema
 */
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["GESTOR"] = "GESTOR";
    Role["CONSIGNATARIA"] = "CONSIGNATARIA";
    Role["CONSIGNANTE"] = "CONSIGNANTE";
    Role["SERVIDOR"] = "SERVIDOR";
    Role["OPERADOR"] = "OPERADOR"; // Operador do sistema
})(Role || (exports.Role = Role = {}));
