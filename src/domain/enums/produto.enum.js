"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoTipo = exports.ProdutoGrupo = void 0;
var ProdutoGrupo;
(function (ProdutoGrupo) {
    ProdutoGrupo[ProdutoGrupo["EMPRESTIMOS"] = 1] = "EMPRESTIMOS";
    ProdutoGrupo[ProdutoGrupo["MENSALIDADES"] = 7] = "MENSALIDADES";
})(ProdutoGrupo || (exports.ProdutoGrupo = ProdutoGrupo = {}));
var ProdutoTipo;
(function (ProdutoTipo) {
    ProdutoTipo[ProdutoTipo["PRAZO_DETERMINADO_PARCELA_FIXA"] = 1] = "PRAZO_DETERMINADO_PARCELA_FIXA";
    ProdutoTipo[ProdutoTipo["PRAZO_INDETERMINADO_PARCELA_FIXA"] = 2] = "PRAZO_INDETERMINADO_PARCELA_FIXA";
    ProdutoTipo[ProdutoTipo["PRAZO_INDETERMINADO_PARCELA_VARIAVEL"] = 3] = "PRAZO_INDETERMINADO_PARCELA_VARIAVEL";
})(ProdutoTipo || (exports.ProdutoTipo = ProdutoTipo = {}));
