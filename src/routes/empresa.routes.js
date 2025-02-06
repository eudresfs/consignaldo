"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empresaRoutes = void 0;
const express_1 = require("express");
const empresa_controller_1 = require("../controllers/empresa.controller");
const router = (0, express_1.Router)();
exports.empresaRoutes = router;
const controller = new empresa_controller_1.EmpresaController();
/**
 * Rota para criação de Empresa (POST /empresas)
 */
router.post("/", controller.criarEmpresa);
/**
 * Rota para listagem de Empresas (GET /empresas)
 */
router.get("/", controller.listarEmpresas);
