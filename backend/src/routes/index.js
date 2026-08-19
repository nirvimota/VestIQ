import { Router } from 'express';
import authRoutes from './authRoutes.js';
import kycRoutes from './kycRoutes.js';
import stockRoutes from './stockRoutes.js';
import orderRoutes from './orderRoutes.js';
import portfolioRoutes from './portfolioRoutes.js';
import watchlistRoutes from './watchlistRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import aiRoutes from './aiRoutes.js';
import newsRoutes from './newsRoutes.js';
import learnRoutes from './learnRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/stocks', stockRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/news', newsRoutes);
router.use('/learn', learnRoutes);

export default router;