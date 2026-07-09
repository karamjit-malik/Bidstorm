import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import type { UserRole } from '../types';

/**
 * Restricts a route to the given roles. Must run after requireAuth.
 * Usage: router.post('/', requireAuth, requireRole('seller', 'admin'), handler)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
}
