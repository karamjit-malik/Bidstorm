import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.get(
  '/seller',
  requireAuth,
  requireRole('seller', 'admin'),
  analyticsController.getSellerAnalytics,
);

export default router;
