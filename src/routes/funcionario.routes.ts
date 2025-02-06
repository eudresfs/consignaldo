import { Router } from 'express';
import { FuncionarioController } from '../controllers/funcionario.controller';

const router = Router();
const controller = new FuncionarioController();

/**
 * Rota para criação de Funcionário (POST /funcionarios)
 */
router.post('/', controller.criarFuncionario);

/**
 * Rota para listagem de Funcionários (GET /funcionarios)
 */
router.get('/', controller.listarFuncionarios);

export { router as funcionarioRoutes }; 