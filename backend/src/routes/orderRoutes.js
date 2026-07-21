import { Router } from 'express';
import { placeOrder, listOrders, cancelOrder } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth);
router.get('/', listOrders);
router.post('/', placeOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;