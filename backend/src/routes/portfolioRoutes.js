import { Router } from 'express';
import { holdings, funds } from '../controllers/portfolioController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth);
router.get('/holdings', holdings);
router.get('/funds', funds);

export default router;