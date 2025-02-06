import { Router } from 'express';

const router = Router();

/**
 * Endpoint de Health Check.
 * Retorna um status e o timestamp atual.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRoutes }; 