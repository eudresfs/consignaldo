"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.funcionarioRoutes = void 0;
const express_1 = require("express");
const funcionario_controller_1 = require("../controllers/funcionario.controller");
const router = (0, express_1.Router)();
exports.funcionarioRoutes = router;
const controller = new funcionario_controller_1.FuncionarioController();
/**
 * Rota para criação de Funcionário (POST /funcionarios)
 */
router.post('/', controller.criarFuncionario);
/**
 * Rota para listagem de Funcionários (GET /funcionarios)
 */
router.get('/', controller.listarFuncionarios);
