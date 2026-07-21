import { Router } from 'express';
import { quote, indices, movers } from '../controllers/stockController.js';

const router = Router();
router.get('/indices', indices);
router.get('/movers', movers);
router.get('/:symbol/quote', quote);

export default router;