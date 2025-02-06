import { Router } from "express";
import { PerfilController } from "../controllers/perfil.controller";

const router = Router();
const controller = new PerfilController();

/**
 * Rota para criação de Perfil (POST /perfis)
 */
router.post("/", controller.criarPerfil);

/**
 * Rota para listagem de Perfis (GET /perfis)
 */
router.get("/", controller.listarPerfis);

export { router as perfilRoutes }; 