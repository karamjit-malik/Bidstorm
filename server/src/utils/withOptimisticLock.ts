import { AppError } from './AppError';

/**
 * Retries an operation that may fail with a version-conflict (HTTP 409) a few
 * times before giving up. The bid flow reads an auction's version, then updates
 * `WHERE version = ?`; if a concurrent bid won the race, affectedRows is 0 and
 * the operation throws 409 — retrying re-reads the fresh version and tries again.
 */
export async function withOptimisticLock<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      const isConflict = err instanceof AppError && err.statusCode === 409;
      if (!isConflict || attempt === maxRetries) throw err;
      lastError = err;
      // Small backoff to let the winning transaction commit before we re-read.
      await sleep(10 * (attempt + 1));
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
