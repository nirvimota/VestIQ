import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getAccount,
  getPortfolio,
  getHoldings,
  getOrders,
  placeOrder,
  resetAccount,
} from '../controllers/paperTradingController.js';

const router = Router();

// All paper trading routes require a valid user session
router.use(requireAuth);

router.get('/account',   getAccount);     // GET  /api/learn/account
router.get('/portfolio', getPortfolio);   // GET  /api/learn/portfolio
router.get('/holdings',  getHoldings);    // GET  /api/learn/holdings
router.get('/orders',    getOrders);      // GET  /api/learn/orders
router.post('/orders',   placeOrder);     // POST /api/learn/orders
router.post('/reset',    resetAccount);   // POST /api/learn/reset

export default router;
