"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEvent = void 0;
/**
 * Eventos que podem gerar notificações
 */
var NotificationEvent;
(function (NotificationEvent) {
    // Eventos de Contrato
    NotificationEvent["CONTRATO_CRIADO"] = "CONTRATO_CRIADO";
    NotificationEvent["CONTRATO_AVERBADO"] = "CONTRATO_AVERBADO";
    NotificationEvent["CONTRATO_REJEITADO"] = "CONTRATO_REJEITADO";
    NotificationEvent["CONTRATO_LIQUIDADO"] = "CONTRATO_LIQUIDADO";
    NotificationEvent["CONTRATO_FINALIZADO"] = "CONTRATO_FINALIZADO";
    // Eventos de Margem
    NotificationEvent["MARGEM_ATUALIZADA"] = "MARGEM_ATUALIZADA";
    NotificationEvent["MARGEM_BLOQUEADA"] = "MARGEM_BLOQUEADA";
    NotificationEvent["MARGEM_LIBERADA"] = "MARGEM_LIBERADA";
    // Eventos de Folha
    NotificationEvent["FOLHA_IMPORTADA"] = "FOLHA_IMPORTADA";
    NotificationEvent["FOLHA_PROCESSADA"] = "FOLHA_PROCESSADA";
    NotificationEvent["FOLHA_ERRO"] = "FOLHA_ERRO";
    // Eventos de Sistema
    NotificationEvent["USUARIO_CRIADO"] = "USUARIO_CRIADO";
    NotificationEvent["USUARIO_BLOQUEADO"] = "USUARIO_BLOQUEADO";
    NotificationEvent["SENHA_REDEFINIDA"] = "SENHA_REDEFINIDA";
    NotificationEvent["ACESSO_SUSPEITO"] = "ACESSO_SUSPEITO";
    // Eventos de Relatório
    NotificationEvent["RELATORIO_GERADO"] = "RELATORIO_GERADO";
    NotificationEvent["RELATORIO_ERRO"] = "RELATORIO_ERRO";
    // Eventos de Integração
    NotificationEvent["INTEGRACAO_ERRO"] = "INTEGRACAO_ERRO";
    NotificationEvent["INTEGRACAO_TIMEOUT"] = "INTEGRACAO_TIMEOUT";
})(NotificationEvent || (exports.NotificationEvent = NotificationEvent = {}));
