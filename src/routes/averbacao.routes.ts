import { Router } from 'express';
import { AverbacaoController } from '../controllers/averbacao.controller';

const router = Router();
const controller = new AverbacaoController();

/**
 * Rota para criação de Averbação (POST /averbacoes)
 */
router.post('/', controller.criarAverbacao);

export { router as averbacaoRoutes }; 