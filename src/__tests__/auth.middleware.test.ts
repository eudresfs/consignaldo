import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.middleware';
import { config } from '../config';

// Configurando uma rota protegida para os testes
const app = express();
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ success: true });
});

describe('Auth Middleware', () => {
  it('deve retornar 401 se o token não for fornecido', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token não fornecido.');
  });

  it('deve retornar 401 se o token estiver mal formatado', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token mal formatado.');
  });

  it('deve retornar 401 para token inválido', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token inválido.');
  });

  it('deve permitir o acesso com um token válido', async () => {
    const token = jwt.sign({ userId: 1 }, config.auth.secret!, { expiresIn: '1h' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
}); 