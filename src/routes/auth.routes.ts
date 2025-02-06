import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

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
const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);

export { router as authRoutes }; 