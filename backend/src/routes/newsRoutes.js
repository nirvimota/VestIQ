import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  marketNewsHandler,
  headlinesHandler,
  stockNewsHandler,
} from '../controllers/newsController.js';

const router = Router();

router.get('/market',       requireAuth, marketNewsHandler);
router.get('/headlines',    requireAuth, headlinesHandler);
router.get('/stock/:symbol', requireAuth, stockNewsHandler);

export default router;
