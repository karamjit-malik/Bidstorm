import type { AuthUser } from './index';

// Augment Express's Request so `req.user` is available after auth middleware.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
