"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza o login e retorna um token JWT.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *               senha:
 *                 type: string
 *             required:
 *               - login
 *               - senha
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Credenciais inválidas.
 */
const router = (0, express_1.Router)();
exports.authRoutes = router;
const controller = new auth_controller_1.AuthController();
router.post('/login', controller.login);
