"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuarioRoutes = void 0;
const express_1 = require("express");
const usuario_controller_1 = require("../controllers/usuario.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.usuarioRoutes = router;
const controller = new usuario_controller_1.UsuarioController();
/**
 * Rota para criação de Usuário (POST /usuarios)
 */
router.post('/', auth_middleware_1.authMiddleware, controller.criarUsuario);
/**
 * Rota para listagem de Usuários (GET /usuarios)
 */
router.get('/', auth_middleware_1.authMiddleware, controller.listarUsuarios);
