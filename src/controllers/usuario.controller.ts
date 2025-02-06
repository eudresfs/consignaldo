import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { ErrorHandler } from '../middleware/error.handler';
import { UsuarioRepository } from '../repositories/implementations/usuario.repository';

/**
 * Controller para endpoints relacionados a Usuários.
 */
export class UsuarioController {
  private usuarioService: UsuarioService;

  constructor() {
    this.usuarioService = new UsuarioService();
  }

  /**
   * Endpoint para criar um novo Usuário (POST /usuarios).
   */
  criarUsuario = async (req: Request, res: Response) => {
    try {
      const dto = req.body;
      const usuario = await this.usuarioService.criarUsuario(dto);
      return res.status(201).json(usuario);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };

  /**
   * Endpoint para listar Usuários (GET /usuarios).
   */
  listarUsuarios = async (req: Request, res: Response) => {
    try {
      const usuarios = await this.usuarioService.listarUsuarios();
      return res.json(usuarios);
    } catch (error) {
      return ErrorHandler.handle(error, res);
    }
  };
} 