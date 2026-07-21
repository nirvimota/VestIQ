import { Router } from 'express';
import { list } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth);
router.get('/', list);

export default router;