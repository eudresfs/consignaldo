"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AverbacaoParcelaSituacao = exports.AverbacaoTipo = exports.AverbacaoSituacao = void 0;
var AverbacaoSituacao;
(function (AverbacaoSituacao) {
    AverbacaoSituacao[AverbacaoSituacao["CANCELADO"] = 0] = "CANCELADO";
    AverbacaoSituacao[AverbacaoSituacao["ATIVO"] = 1] = "ATIVO";
    AverbacaoSituacao[AverbacaoSituacao["AVERBADO"] = 2] = "AVERBADO";
    AverbacaoSituacao[AverbacaoSituacao["AGUARDANDO_APROVACAO"] = 3] = "AGUARDANDO_APROVACAO";
    AverbacaoSituacao[AverbacaoSituacao["RESERVADO"] = 4] = "RESERVADO";
    AverbacaoSituacao[AverbacaoSituacao["DESAPROVADO"] = 5] = "DESAPROVADO";
    AverbacaoSituacao[AverbacaoSituacao["SUSPENSO_MARGEM_LIVRE"] = 6] = "SUSPENSO_MARGEM_LIVRE";
    AverbacaoSituacao[AverbacaoSituacao["BLOQUEADO_MARGEM_RETIDA"] = 7] = "BLOQUEADO_MARGEM_RETIDA";
    AverbacaoSituacao[AverbacaoSituacao["EM_PROCESSO_COMPRA"] = 8] = "EM_PROCESSO_COMPRA";
    AverbacaoSituacao[AverbacaoSituacao["COMPRADO"] = 9] = "COMPRADO";
    AverbacaoSituacao[AverbacaoSituacao["LIQUIDADO"] = 10] = "LIQUIDADO";
    AverbacaoSituacao[AverbacaoSituacao["CONCLUIDO"] = 11] = "CONCLUIDO";
    AverbacaoSituacao[AverbacaoSituacao["PRE_RESERVA"] = 12] = "PRE_RESERVA";
})(AverbacaoSituacao || (exports.AverbacaoSituacao = AverbacaoSituacao = {}));
var AverbacaoTipo;
(function (AverbacaoTipo) {
    AverbacaoTipo[AverbacaoTipo["NORMAL"] = 1] = "NORMAL";
    AverbacaoTipo[AverbacaoTipo["COMPRA"] = 2] = "COMPRA";
    AverbacaoTipo[AverbacaoTipo["RENEGOCIACAO"] = 3] = "RENEGOCIACAO";
    AverbacaoTipo[AverbacaoTipo["COMPRA_E_RENEGOCIACAO"] = 4] = "COMPRA_E_RENEGOCIACAO";
})(AverbacaoTipo || (exports.AverbacaoTipo = AverbacaoTipo = {}));
var AverbacaoParcelaSituacao;
(function (AverbacaoParcelaSituacao) {
    AverbacaoParcelaSituacao[AverbacaoParcelaSituacao["CANCELADA"] = 0] = "CANCELADA";
    AverbacaoParcelaSituacao[AverbacaoParcelaSituacao["ABERTA"] = 1] = "ABERTA";
    AverbacaoParcelaSituacao[AverbacaoParcelaSituacao["LIQUIDADA_FOLHA"] = 2] = "LIQUIDADA_FOLHA";
    AverbacaoParcelaSituacao[AverbacaoParcelaSituacao["LIQUIDADA_MANUAL"] = 3] = "LIQUIDADA_MANUAL";
    AverbacaoParcelaSituacao[AverbacaoParcelaSituacao["REJEITADA_FOLHA"] = 4] = "REJEITADA_FOLHA";
})(AverbacaoParcelaSituacao || (exports.AverbacaoParcelaSituacao = AverbacaoParcelaSituacao = {}));
