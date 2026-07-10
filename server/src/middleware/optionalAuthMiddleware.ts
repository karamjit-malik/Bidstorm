import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Attaches req.user if a valid Bearer token is present, but never rejects.
 * Used on public routes that personalize when signed in (e.g. recording a
 * "view" interaction on auction detail, or filtering out your own auctions).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    try {
      req.user = verifyAccessToken(token);
    } catch {
      /* ignore invalid token — treat as anonymous */
    }
  }
  next();
}
