"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioController = void 0;
const funcionario_service_1 = require("../services/funcionario.service");
const error_handler_1 = require("../middleware/error.handler");
/**
 * Controller para endpoints relacionados a Funcionários.
 */
class FuncionarioController {
    constructor() {
        /**
         * Endpoint para criar um novo Funcionário (POST /funcionarios)
         */
        this.criarFuncionario = async (req, res) => {
            try {
                const dto = req.body;
                const funcionario = await this.funcionarioService.criarFuncionario(dto);
                return res.status(201).json(funcionario);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        /**
         * Endpoint para listar Funcionários (GET /funcionarios)
         */
        this.listarFuncionarios = async (req, res) => {
            try {
                const funcionarios = await this.funcionarioService.listarFuncionarios();
                return res.json(funcionarios);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        this.funcionarioService = new funcionario_service_1.FuncionarioService();
    }
}
exports.FuncionarioController = FuncionarioController;
