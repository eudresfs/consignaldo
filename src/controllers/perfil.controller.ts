import { Request, Response } from "express";
import { PerfilService } from "../services/perfil.service";
import { ErrorHandler } from "../middleware/error.handler";

/**
 * Controller para endpoints relacionados a Perfil.
 */
export class PerfilController {
  private perfilService: PerfilService;

  constructor() {
    this.perfilService = new PerfilService();
  }

  /**
   * Endpoint para criar um novo Perfil.
   */
  criarPerfil = async (req: Request, res: Response) => {
    try {
      const dto = req.body;
      const perfil = await this.perfilService.criarPerfil(dto);
      return res.status(201).json(perfil);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };

  /**
   * Endpoint para listar Perfis.
   */
  listarPerfis = async (req: Request, res: Response) => {
    try {
      const perfis = await this.perfilService.listarPerfis();
      return res.json(perfis);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };
} 