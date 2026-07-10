import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as recommendationController from '../controllers/recommendationController';

const router = Router();

router.get('/for-you', requireAuth, recommendationController.getForYou);
router.get('/trending', recommendationController.getTrending);
router.get('/similar/:auctionId', recommendationController.getSimilar);

export default router;
