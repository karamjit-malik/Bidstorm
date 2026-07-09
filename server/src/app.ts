import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Baseline rate limit; per-route limits (e.g. bidding) are added in later phases.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Health check — used by tooling and the Phase 1 acceptance check.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ success: true, data: { status: 'ok', service: 'bidstorm-server' } });
  });

  // Feature routers (auth, auctions, bids, ...) are mounted here in later phases.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
