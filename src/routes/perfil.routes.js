"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfilRoutes = void 0;
const express_1 = require("express");
const perfil_controller_1 = require("../controllers/perfil.controller");
const router = (0, express_1.Router)();
exports.perfilRoutes = router;
const controller = new perfil_controller_1.PerfilController();
/**
 * Rota para criação de Perfil (POST /perfis)
 */
router.post("/", controller.criarPerfil);
/**
 * Rota para listagem de Perfis (GET /perfis)
 */
router.get("/", controller.listarPerfis);
