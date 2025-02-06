// Arquivo de configuração da aplicação
export const config = {
  api: {
    prefix: '/api' // Prefixo base para as rotas da API
  },
  auth: {
    secret: process.env.JWT_SECRET || 'secrettoken' // Chave para assinatura dos tokens JWT
  }
}; 