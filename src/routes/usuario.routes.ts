import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UsuarioRepository } from '../repositories/implementations/usuario.repository';

const router = Router();
const controller = new UsuarioController();

/**
 * Rota para criação de Usuário (POST /usuarios)
 */
router.post('/', authMiddleware, controller.criarUsuario);

/**
 * Rota para listagem de Usuários (GET /usuarios)
 */
router.get('/', authMiddleware, controller.listarUsuarios);

export { router as usuarioRoutes }; 