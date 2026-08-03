import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  analyzeStockHandler,
  marketSummaryHandler,
  chatHandler,
  portfolioHealthHandler,
} from '../controllers/aiController.js';

const router = Router();

// Public (rate-limited by global middleware)
router.get('/market-summary', marketSummaryHandler);

// Require auth
router.get('/analyze/:symbol', requireAuth, analyzeStockHandler);
router.post('/chat',           requireAuth, chatHandler);
router.get('/portfolio-health', requireAuth, portfolioHealthHandler);

export default router;
