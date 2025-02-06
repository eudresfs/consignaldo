"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaController = void 0;
const empresa_service_1 = require("../services/empresa.service");
const error_handler_1 = require("../middleware/error.handler");
/**
 * Controller para endpoints relacionados a Empresa.
 */
class EmpresaController {
    constructor() {
        /**
         * Endpoint para criar uma nova Empresa.
         */
        this.criarEmpresa = async (req, res) => {
            try {
                const dto = req.body;
                const empresa = await this.empresaService.criarEmpresa(dto);
                return res.status(201).json(empresa);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        /**
         * Endpoint para listar Empresas.
         */
        this.listarEmpresas = async (req, res) => {
            try {
                const empresas = await this.empresaService.listarEmpresas();
                return res.json(empresas);
            }
            catch (error) {
                return error_handler_1.ErrorHandler.handle(error, res);
            }
        };
        this.empresaService = new empresa_service_1.EmpresaService();
    }
}
exports.EmpresaController = EmpresaController;
