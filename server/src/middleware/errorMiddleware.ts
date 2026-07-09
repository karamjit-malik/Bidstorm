import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Centralized error handler. Controllers never try/catch; they throw AppError
 * (or forward errors via catchAsync) and this shapes the JSON response.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : 'Internal server error';

  if (!isAppError) {
    // Unexpected error — log full detail server-side.
    console.error('[unhandled error]', err);
  }

  res.status(statusCode).json({ success: false, error: message });
}
