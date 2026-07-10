import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Bid rate limiter: max 5 bids per minute per authenticated user. Keyed by user
 * id (falls back to IP) so one user can't spam bids across connections. Must run
 * after requireAuth.
 */
export const bidRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.user ? `user:${req.user.id}` : (req.ip ?? 'anon')),
  message: { success: false, error: 'Too many bids — slow down and try again shortly' },
});
