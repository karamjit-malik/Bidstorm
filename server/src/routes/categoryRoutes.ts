import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { requireAuth } from '../middleware/authMiddleware';
import * as categoryController from '../controllers/categoryController';

const router = Router();

router.get('/', categoryController.listCategories);

// User category preferences (onboarding) — feed the cold-start recommender.
router.post(
  '/preferences',
  requireAuth,
  validate([body('categoryIds').isArray().withMessage('categoryIds must be an array')]),
  categoryController.setPreferences,
);
router.get('/preferences', requireAuth, categoryController.getPreferences);

export default router;
