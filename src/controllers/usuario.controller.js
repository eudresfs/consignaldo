"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioController = void 0;
const usuario_service_1 = require("../services/usuario.service");
const error_handler_1 = require("../middleware/error.handler");
/**
 * Controller para endpoints relacionados a Usuários.
 */
class UsuarioController {
    constructor() {
        /**
         * Endpoint para criar um novo Usuário (POST /usuarios).
         */
        this.criarUsuario = async (req, res) => {
            try {
                const dto = req.body;
                const usuario = await this.usuarioService.criarUsuario(dto);
                return res.status(201).json(usuario);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        /**
         * Endpoint para listar Usuários (GET /usuarios).
         */
        this.listarUsuarios = async (req, res) => {
            try {
                const usuarios = await this.usuarioService.listarUsuarios();
                return res.json(usuarios);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        this.usuarioService = new usuario_service_1.UsuarioService();
    }
}
exports.UsuarioController = UsuarioController;
