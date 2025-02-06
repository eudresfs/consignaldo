import { Request, Response } from 'express';
import { FuncionarioService } from '../services/funcionario.service';
import { ErrorHandler } from '../middleware/error.handler';

/**
 * Controller para endpoints relacionados a Funcionários.
 */
export class FuncionarioController {
  private funcionarioService: FuncionarioService;

  constructor() {
    this.funcionarioService = new FuncionarioService();
  }

  /**
   * Endpoint para criar um novo Funcionário (POST /funcionarios)
   */
  criarFuncionario = async (req: Request, res: Response) => {
    try {
      const dto = req.body;
      const funcionario = await this.funcionarioService.criarFuncionario(dto);
      return res.status(201).json(funcionario);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };

  /**
   * Endpoint para listar Funcionários (GET /funcionarios)
   */
  listarFuncionarios = async (req: Request, res: Response) => {
    try {
      const funcionarios = await this.funcionarioService.listarFuncionarios();
      return res.json(funcionarios);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };
} 