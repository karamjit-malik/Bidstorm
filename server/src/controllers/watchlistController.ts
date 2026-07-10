import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as watchlistModel from '../models/watchlistModel';
import * as interactionModel from '../models/interactionModel';
import * as auctionModel from '../models/auctionModel';
import { toSummaries } from '../services/auctionService';

function parseAuctionId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid auction id', 400);
  return id;
}

export const getWatchlist = catchAsync(async (req: Request, res: Response) => {
  const ids = await watchlistModel.auctionIdsForUser(req.user!.id);
  const rows = await auctionModel.findByIds(ids);
  // Preserve watchlist order (most recently added first).
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = ids.map((id) => byId.get(id)).filter((r): r is (typeof rows)[number] => !!r);
  res.json({ success: true, data: { items: await toSummaries(ordered) } });
});

export const addToWatchlist = catchAsync(async (req: Request, res: Response) => {
  const auctionId = parseAuctionId(req.params.auctionId);
  const auction = await auctionModel.findById(auctionId);
  if (!auction) throw new AppError('Auction not found', 404);

  const added = await watchlistModel.add(req.user!.id, auctionId);
  // Record the interaction only on first add (weight 3.0), skipping own auctions.
  if (added && auction.seller_id !== req.user!.id) {
    await interactionModel.recordInteraction(req.user!.id, auctionId, 'watchlist');
  }
  res.status(added ? 201 : 200).json({ success: true, data: { watching: true } });
});

export const removeFromWatchlist = catchAsync(async (req: Request, res: Response) => {
  const auctionId = parseAuctionId(req.params.auctionId);
  await watchlistModel.remove(req.user!.id, auctionId);
  res.json({ success: true, data: { watching: false } });
});
