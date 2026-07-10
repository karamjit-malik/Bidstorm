import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { requireAuth } from '../middleware/authMiddleware';
import { optionalAuth } from '../middleware/optionalAuthMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { uploadAuctionImages } from '../middleware/uploadMiddleware';
import * as auctionController from '../controllers/auctionController';

const router = Router();

const createValidators = [
  body('categoryId').isInt({ min: 1 }).withMessage('A valid category is required'),
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be at least 10 characters'),
  body('startingPrice').isFloat({ gt: 0 }).withMessage('Starting price must be greater than 0'),
  body('reservePrice').optional({ nullable: true }).isFloat({ gt: 0 }),
  body('minBidIncrement').optional().isFloat({ gt: 0 }),
  body('startTime').isISO8601().withMessage('A valid start time is required'),
  body('endTime').isISO8601().withMessage('A valid end time is required'),
  body('antiSnipeSeconds').optional().isInt({ min: 0, max: 3600 }),
  body('extensionSeconds').optional().isInt({ min: 0, max: 3600 }),
];

const updateValidators = [
  body('categoryId').optional().isInt({ min: 1 }),
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ min: 10, max: 5000 }),
  body('startingPrice').optional().isFloat({ gt: 0 }),
  body('reservePrice').optional({ nullable: true }).isFloat({ gt: 0 }),
  body('minBidIncrement').optional().isFloat({ gt: 0 }),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('antiSnipeSeconds').optional().isInt({ min: 0, max: 3600 }),
  body('extensionSeconds').optional().isInt({ min: 0, max: 3600 }),
];

// --- Public reads ---
router.get('/', auctionController.listAuctions);

// Seller dashboard — must be declared before '/:id' so it isn't shadowed.
router.get('/mine', requireAuth, requireRole('seller', 'admin'), auctionController.listMyAuctions);

// optionalAuth: personalizes (records a view) when signed in, still public.
router.get('/:id', optionalAuth, auctionController.getAuction);

// --- Seller-owned mutations ---
router.post(
  '/',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(createValidators),
  auctionController.createAuction,
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  validate(updateValidators),
  auctionController.updateAuction,
);

router.delete('/:id', requireAuth, requireRole('seller', 'admin'), auctionController.deleteAuction);

router.post(
  '/:id/publish',
  requireAuth,
  requireRole('seller', 'admin'),
  auctionController.publishAuction,
);

router.post(
  '/:id/images',
  requireAuth,
  requireRole('seller', 'admin'),
  uploadAuctionImages,
  auctionController.uploadImages,
);

router.delete(
  '/:id/images/:imageId',
  requireAuth,
  requireRole('seller', 'admin'),
  auctionController.deleteImage,
);

export default router;
