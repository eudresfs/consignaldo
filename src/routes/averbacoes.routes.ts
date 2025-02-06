import { Router } from "express";
import { AverbacaoController } from "../controllers/averbacao.controller";

const router = Router();
const controller = new AverbacaoController();

/**
 * Rota para criação de Averbacão (POST /averbacoes)
 */
router.post("/", controller.criarAverbacao);

/**
 * Rota para listagem de Averbacões (GET /averbacoes)
 */
router.get("/", controller.listarAverbacoes);

export { router as averbacaoRoutes }; 