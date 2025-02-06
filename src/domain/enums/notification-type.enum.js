"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
/**
 * Tipos de notificações suportadas pelo sistema
 */
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["PUSH"] = "PUSH";
    NotificationType["WHATSAPP"] = "WHATSAPP";
    NotificationType["WEBHOOK"] = "WEBHOOK";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
