import type { Request, Response, NextFunction } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';
import { AppError } from '../utils/AppError';

/**
 * Runs a set of express-validator chains, then rejects with 400 (and the first
 * message) if any failed. Keeps controllers free of validation branching.
 */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await Promise.all(chains.map((chain) => chain.run(req)));
      const result = validationResult(req);
      if (!result.isEmpty()) {
        const first = result.array()[0];
        next(new AppError(first.msg as string, 400));
        return;
      }
      next();
    } catch (err) {
      // Async middleware must forward errors; a throw here would crash the process.
      next(err);
    }
  };
}
