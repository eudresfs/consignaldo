"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Perfil = exports.Modulos = exports.FuncionarioSituacao = void 0;
var FuncionarioSituacao;
(function (FuncionarioSituacao) {
    FuncionarioSituacao[FuncionarioSituacao["NAO_INFORMADO"] = 0] = "NAO_INFORMADO";
    FuncionarioSituacao[FuncionarioSituacao["ATIVO_NA_FOLHA"] = 1] = "ATIVO_NA_FOLHA";
    FuncionarioSituacao[FuncionarioSituacao["RETIRADO_DA_FOLHA"] = 2] = "RETIRADO_DA_FOLHA";
    FuncionarioSituacao[FuncionarioSituacao["EXONERADO"] = 3] = "EXONERADO";
    FuncionarioSituacao[FuncionarioSituacao["BLOQUEADO"] = 4] = "BLOQUEADO";
    FuncionarioSituacao[FuncionarioSituacao["APOSENTADO"] = 5] = "APOSENTADO";
})(FuncionarioSituacao || (exports.FuncionarioSituacao = FuncionarioSituacao = {}));
var Modulos;
(function (Modulos) {
    Modulos[Modulos["CONSIGNANTE"] = 1] = "CONSIGNANTE";
    Modulos[Modulos["FUNCIONARIO"] = 2] = "FUNCIONARIO";
    Modulos[Modulos["CONSIGNATARIA"] = 3] = "CONSIGNATARIA";
    Modulos[Modulos["AGENTE"] = 4] = "AGENTE";
    Modulos[Modulos["SINDICATO"] = 6] = "SINDICATO";
})(Modulos || (exports.Modulos = Modulos = {}));
var Perfil;
(function (Perfil) {
    Perfil[Perfil["MASTER_CONSIGNATARIA"] = 3] = "MASTER_CONSIGNATARIA";
    Perfil[Perfil["AGENTE"] = 4] = "AGENTE";
})(Perfil || (exports.Perfil = Perfil = {}));
