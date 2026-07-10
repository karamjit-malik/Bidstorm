import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { requireAuth } from '../middleware/authMiddleware';
import { bidRateLimiter } from '../middleware/rateLimitMiddleware';
import * as bidController from '../controllers/bidController';

const router = Router();

const bidValidators = [
  body('amount').isFloat({ gt: 0 }).withMessage('A valid bid amount is required'),
];

const retractValidators = [
  body('reason').trim().isLength({ min: 3, max: 500 }).withMessage('A reason is required'),
];

// Place a bid — authenticated, rate-limited to 5/min/user.
router.post(
  '/auctions/:id/bid',
  requireAuth,
  bidRateLimiter,
  validate(bidValidators),
  bidController.placeBid,
);

// Public bid history for an auction.
router.get('/auctions/:id/bids', bidController.getBidHistory);

// Retract one of your own bids (limited window).
router.post(
  '/bids/:id/retract',
  requireAuth,
  validate(retractValidators),
  bidController.retractBid,
);

// All bids by the current user.
router.get('/my-bids', requireAuth, bidController.getMyBids);

export default router;
