import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as watchlistController from '../controllers/watchlistController';

const router = Router();

router.get('/', requireAuth, watchlistController.getWatchlist);
router.post('/:auctionId', requireAuth, watchlistController.addToWatchlist);
router.delete('/:auctionId', requireAuth, watchlistController.removeFromWatchlist);

export default router;
