import { Router } from 'express';
import { submit } from '../controllers/kycController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/', requireAuth, submit);

export default router;