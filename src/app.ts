import express from 'express';
import { config } from './config';
import { produtoRoutes } from './routes/produto.routes';
import { usuarioRoutes } from './routes/usuario.routes';
import { funcionarioRoutes } from './routes/funcionario.routes';
import { perfilRoutes } from './routes/perfil.routes';
import { averbacaoRoutes } from './routes/averbacao.routes';
import { empresaRoutes } from './routes/empresa.routes';
import { loggerMiddleware } from './middleware/logger.middleware';
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';

const app = express();

// Middlewares
app.use(loggerMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check (não utiliza o prefixo da API)
app.use('/health', healthRoutes);

// Documentação Swagger (acessível em /docs)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Configuração das rotas
const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/produtos`, produtoRoutes);
app.use(`${apiPrefix}/usuarios`, usuarioRoutes);
app.use(`${apiPrefix}/funcionarios`, funcionarioRoutes);
app.use(`${apiPrefix}/perfis`, perfilRoutes);
app.use(`${apiPrefix}/averbacoes`, averbacaoRoutes);
app.use(`${apiPrefix}/empresas`, empresaRoutes);

// Rota de autenticação
app.use(`${apiPrefix}/auth`, authRoutes);

export default app; 