import path from 'path';
import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import auctionRoutes from './routes/auctionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import bidRoutes from './routes/bidRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import watchlistRoutes from './routes/watchlistRoutes';

export function createApp(): Application {
  const app = express();

  // Allow the SPA (a different origin in dev) to load <img> from /uploads.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

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

  // Serve uploaded auction images. Files live under UPLOAD_DIR on disk and are
  // exposed read-only at /uploads/... (paths stored in the DB).
  app.use(
    config.upload.publicPath,
    express.static(path.resolve(config.upload.dir), {
      fallthrough: false,
      maxAge: '7d',
    }),
  );

  // Feature routers
  app.use('/api/auth', authRoutes);
  app.use('/api/auctions', auctionRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/bids', bidRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/watchlist', watchlistRoutes);
  // (reviews, admin, ... mounted here in later phases)

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
