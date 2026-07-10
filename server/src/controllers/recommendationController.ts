import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as recommendationService from '../services/recommendationService';

export const getForYou = catchAsync(async (req: Request, res: Response) => {
  const items = await recommendationService.getForYou(req.user!.id);
  res.json({ success: true, data: { items } });
});

export const getTrending = catchAsync(async (_req: Request, res: Response) => {
  const items = await recommendationService.getTrending();
  res.json({ success: true, data: { items } });
});

export const getSimilar = catchAsync(async (req: Request, res: Response) => {
  const auctionId = Number(req.params.auctionId);
  if (!Number.isInteger(auctionId) || auctionId <= 0) {
    throw new AppError('Invalid auction id', 400);
  }
  const items = await recommendationService.getSimilar(auctionId);
  res.json({ success: true, data: { items } });
});
