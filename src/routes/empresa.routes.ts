import { Router } from "express";
import { EmpresaController } from "../controllers/empresa.controller";

const router = Router();
const controller = new EmpresaController();

/**
 * Rota para criação de Empresa (POST /empresas)
 */
router.post("/", controller.criarEmpresa);

/**
 * Rota para listagem de Empresas (GET /empresas)
 */
router.get("/", controller.listarEmpresas);

export { router as empresaRoutes }; 