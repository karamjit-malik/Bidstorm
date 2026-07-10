import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as biddingService from '../services/biddingService';
import * as notificationService from '../services/notificationService';
import * as bidModel from '../models/bidModel';
import {
  broadcastNewBid,
  broadcastBidRetracted,
  broadcastAntiSnipe,
  broadcastStateChange,
} from '../socket/auctionRoom';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid id', 400);
  return id;
}

export const placeBid = catchAsync(async (req: Request, res: Response) => {
  const auctionId = parseId(req.params.id);
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('A valid bid amount is required', 400);
  }

  const result = await biddingService.placeBid(auctionId, req.user!, amount, req.ip ?? null);

  // --- Real-time fan-out (after the transaction has committed). ---
  broadcastNewBid(auctionId, {
    bidId: result.bid.id,
    amount: result.bid.amount,
    bidderUsername: result.bid.bidderUsername,
    bidCount: result.auction.bidCount,
    timestamp: result.bid.createdAt.toISOString(),
  });

  if (result.antiSnipe.triggered && result.antiSnipe.newEndTime) {
    broadcastAntiSnipe(auctionId, {
      newEndTime: result.antiSnipe.newEndTime.toISOString(),
      extensionSeconds: result.antiSnipe.extensionSeconds!,
    });
    broadcastStateChange(auctionId, result.auction.state, result.antiSnipe.newEndTime.toISOString());
  }

  if (result.previousBidderId) {
    await notificationService.notifyOutbid(
      result.previousBidderId,
      auctionId,
      result.auction.title,
      result.bid.amount,
    );
  }

  res.status(201).json({
    success: true,
    data: {
      bid: result.bid,
      auction: {
        id: result.auction.id,
        currentBid: result.auction.currentBid,
        bidCount: result.auction.bidCount,
        state: result.auction.state,
        endTime: result.auction.endTime,
      },
      antiSnipe: result.antiSnipe,
    },
  });
});

export const getBidHistory = catchAsync(async (req: Request, res: Response) => {
  const auctionId = parseId(req.params.id);
  const rows = await bidModel.findByAuction(auctionId);
  res.json({ success: true, data: { bids: rows.map(bidModel.toPublicBid) } });
});

export const retractBid = catchAsync(async (req: Request, res: Response) => {
  const bidId = parseId(req.params.id);
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (reason.length < 3) throw new AppError('A reason is required to retract a bid', 400);

  const result = await biddingService.retractBid(bidId, req.user!, reason);

  broadcastBidRetracted(result.auctionId, {
    bidId: result.bidId,
    newCurrentBid: result.newCurrentBid,
  });

  res.json({ success: true, data: result });
});

export const getMyBids = catchAsync(async (req: Request, res: Response) => {
  const rows = await bidModel.findByBidder(req.user!.id);
  const bids = rows.map((r) => ({
    ...bidModel.toPublicBid(r),
    auctionTitle: r.auction_title ?? null,
    auctionState: r.auction_state ?? null,
  }));
  res.json({ success: true, data: { bids } });
});
