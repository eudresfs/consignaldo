import { Request, Response } from "express";
import { EmpresaService } from "../services/empresa.service";
import { ErrorHandler } from "../middleware/error.handler";

/**
 * Controller para endpoints relacionados a Empresa.
 */
export class EmpresaController {
  private empresaService: EmpresaService;

  constructor() {
    this.empresaService = new EmpresaService();
  }

  /**
   * Endpoint para criar uma nova Empresa.
   */
  criarEmpresa = async (req: Request, res: Response) => {
    try {
      const dto = req.body;
      const empresa = await this.empresaService.criarEmpresa(dto);
      return res.status(201).json(empresa);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };

  /**
   * Endpoint para listar Empresas.
   */
  listarEmpresas = async (req: Request, res: Response) => {
    try {
      const empresas = await this.empresaService.listarEmpresas();
      return res.json(empresas);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };
} 