import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * Returns server status and uptime
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Memvery API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
