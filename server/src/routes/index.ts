import { Router } from 'express';
import healthRouter from './health';
import contentRouter from './content';
import chatRouter from './chat';

const router = Router();

/**
 * API Routes
 */
router.use('/health', healthRouter);
router.use('/content', contentRouter);
router.use('/chat', chatRouter);

export default router;
