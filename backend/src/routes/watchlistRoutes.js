import { Router } from 'express';
import { list, add, remove } from '../controllers/watchlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth);
router.get('/', list);
router.post('/', add);
router.delete('/:symbol', remove);

export default router;