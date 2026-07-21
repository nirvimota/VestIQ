import { Router } from 'express';
import authRoutes from './authRoutes.js';
import kycRoutes from './kycRoutes.js';
import stockRoutes from './stockRoutes.js';
import orderRoutes from './orderRoutes.js';
import portfolioRoutes from './portfolioRoutes.js';
import watchlistRoutes from './watchlistRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/stocks', stockRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/notifications', notificationRoutes);

export default router;