import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { requireAuth } from '../middleware/authMiddleware';
import * as authController from '../controllers/authController';

const router = Router();

const registerValidators = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores'),
  body('fullName').trim().isLength({ min: 1, max: 100 }).withMessage('Full name is required'),
  body('role').optional().isIn(['buyer', 'seller']).withMessage('Invalid role'),
];

const loginValidators = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateMeValidators = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid username'),
  body('fullName').optional().trim().isLength({ min: 1, max: 100 }),
  body('avatarUrl').optional().isURL().withMessage('Avatar must be a valid URL'),
];

router.post('/register', validate(registerValidators), authController.register);
router.post('/login', validate(loginValidators), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.patch('/me', requireAuth, validate(updateMeValidators), authController.updateMe);

// Email verification — GET (clickable link, redirects) + POST (JSON) for the same token.
router.get('/verify/:token', authController.verifyEmailRedirect);
router.post('/verify/:token', authController.verifyEmail);

export default router;
