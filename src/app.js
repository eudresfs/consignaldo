"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const produto_routes_1 = require("./routes/produto.routes");
const usuario_routes_1 = require("./routes/usuario.routes");
const funcionario_routes_1 = require("./routes/funcionario.routes");
const perfil_routes_1 = require("./routes/perfil.routes");
const averbacao_routes_1 = require("./routes/averbacao.routes");
const empresa_routes_1 = require("./routes/empresa.routes");
const logger_middleware_1 = require("./middleware/logger.middleware");
const health_routes_1 = require("./routes/health.routes");
const auth_routes_1 = require("./routes/auth.routes");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./docs/swagger");
const app = (0, express_1.default)();
// Middlewares
app.use(logger_middleware_1.loggerMiddleware);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rota de Health Check (não utiliza o prefixo da API)
app.use('/health', health_routes_1.healthRoutes);
// Documentação Swagger (acessível em /docs)
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// Configuração das rotas
const apiPrefix = config_1.config.api.prefix;
app.use(`${apiPrefix}/produtos`, produto_routes_1.produtoRoutes);
app.use(`${apiPrefix}/usuarios`, usuario_routes_1.usuarioRoutes);
app.use(`${apiPrefix}/funcionarios`, funcionario_routes_1.funcionarioRoutes);
app.use(`${apiPrefix}/perfis`, perfil_routes_1.perfilRoutes);
app.use(`${apiPrefix}/averbacoes`, averbacao_routes_1.averbacaoRoutes);
app.use(`${apiPrefix}/empresas`, empresa_routes_1.empresaRoutes);
// Rota de autenticação
app.use(`${apiPrefix}/auth`, auth_routes_1.authRoutes);
exports.default = app;
