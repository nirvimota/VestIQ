import { Router } from 'express';
import { quote, quotes, indices, movers, search, history } from '../controllers/stockController.js';

const router = Router();
router.get('/indices', indices);
router.get('/movers', movers);
router.get('/search', search);
router.get('/quotes', quotes);        // batch: ?symbols=RELIANCE,TCS,INFY
router.get('/:symbol/quote', quote);
router.get('/:symbol/history', history);

export default router;