"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsignanteTipo = exports.EmpresaSituacao = exports.EmpresaTipo = void 0;
var EmpresaTipo;
(function (EmpresaTipo) {
    EmpresaTipo[EmpresaTipo["CASE_PARTNERS"] = 1] = "CASE_PARTNERS";
    EmpresaTipo[EmpresaTipo["CONSIGNANTE"] = 2] = "CONSIGNANTE";
    EmpresaTipo[EmpresaTipo["AGENTE"] = 3] = "AGENTE";
    EmpresaTipo[EmpresaTipo["BANCO"] = 4] = "BANCO";
    EmpresaTipo[EmpresaTipo["FINANCEIRA"] = 5] = "FINANCEIRA";
    EmpresaTipo[EmpresaTipo["SINDICATO"] = 6] = "SINDICATO";
    EmpresaTipo[EmpresaTipo["ASSOCIACAO"] = 7] = "ASSOCIACAO";
    EmpresaTipo[EmpresaTipo["CONVENIO"] = 8] = "CONVENIO";
})(EmpresaTipo || (exports.EmpresaTipo = EmpresaTipo = {}));
var EmpresaSituacao;
(function (EmpresaSituacao) {
    EmpresaSituacao[EmpresaSituacao["NORMAL"] = 1] = "NORMAL";
    EmpresaSituacao[EmpresaSituacao["SUSPENSO_AVERBACOES"] = 2] = "SUSPENSO_AVERBACOES";
    EmpresaSituacao[EmpresaSituacao["SUSPENSO_COMPRA"] = 3] = "SUSPENSO_COMPRA";
    EmpresaSituacao[EmpresaSituacao["BLOQUEADO"] = 4] = "BLOQUEADO";
    EmpresaSituacao[EmpresaSituacao["BLOQUEIO_PERSONALIZADO"] = 5] = "BLOQUEIO_PERSONALIZADO";
})(EmpresaSituacao || (exports.EmpresaSituacao = EmpresaSituacao = {}));
var ConsignanteTipo;
(function (ConsignanteTipo) {
    ConsignanteTipo["ESTADO"] = "ESTADO";
    ConsignanteTipo["CIDADE"] = "CIDADE";
    ConsignanteTipo["AUTARQUIA"] = "AUTARQUIA";
})(ConsignanteTipo || (exports.ConsignanteTipo = ConsignanteTipo = {}));
