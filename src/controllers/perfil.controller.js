"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilController = void 0;
const perfil_service_1 = require("../services/perfil.service");
const error_handler_1 = require("../middleware/error.handler");
/**
 * Controller para endpoints relacionados a Perfil.
 */
class PerfilController {
    constructor() {
        /**
         * Endpoint para criar um novo Perfil.
         */
        this.criarPerfil = async (req, res) => {
            try {
                const dto = req.body;
                const perfil = await this.perfilService.criarPerfil(dto);
                return res.status(201).json(perfil);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        /**
         * Endpoint para listar Perfis.
         */
        this.listarPerfis = async (req, res) => {
            try {
                const perfis = await this.perfilService.listarPerfis();
                return res.json(perfis);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        this.perfilService = new perfil_service_1.PerfilService();
    }
}
exports.PerfilController = PerfilController;
