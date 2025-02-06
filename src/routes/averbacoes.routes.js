"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.averbacaoRoutes = void 0;
const express_1 = require("express");
const averbacao_controller_1 = require("../controllers/averbacao.controller");
const router = (0, express_1.Router)();
exports.averbacaoRoutes = router;
const controller = new averbacao_controller_1.AverbacaoController();
/**
 * Rota para criação de Averbacão (POST /averbacoes)
 */
router.post("/", controller.criarAverbacao);
/**
 * Rota para listagem de Averbacões (GET /averbacoes)
 */
router.get("/", controller.listarAverbacoes);
