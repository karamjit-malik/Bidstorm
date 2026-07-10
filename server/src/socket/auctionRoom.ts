import { getIo } from './socketManager';
import {
  ANTI_SNIPE_EXTENSION,
  AUCTION_ENDED,
  AUCTION_STATE_CHANGE,
  BID_RETRACTED,
  NEW_BID,
  OUTBID_ALERT,
  auctionRoom,
  userRoom,
} from './events';
import type { AuctionState } from '../types';

/** Broadcasts a new bid to everyone watching the auction. */
export function broadcastNewBid(
  auctionId: number,
  payload: {
    bidId: number;
    amount: number;
    bidderUsername: string;
    bidCount: number;
    timestamp: string;
  },
): void {
  getIo().to(auctionRoom(auctionId)).emit(NEW_BID, payload);
}

export function broadcastBidRetracted(
  auctionId: number,
  payload: { bidId: number; newCurrentBid: number },
): void {
  getIo().to(auctionRoom(auctionId)).emit(BID_RETRACTED, payload);
}

export function broadcastAntiSnipe(
  auctionId: number,
  payload: { newEndTime: string; extensionSeconds: number },
): void {
  getIo()
    .to(auctionRoom(auctionId))
    .emit(ANTI_SNIPE_EXTENSION, { auctionId, ...payload });
}

export function broadcastStateChange(
  auctionId: number,
  newState: AuctionState,
  endTime?: string,
): void {
  getIo()
    .to(auctionRoom(auctionId))
    .emit(AUCTION_STATE_CHANGE, { auctionId, newState, endTime });
}

export function broadcastAuctionEnded(
  auctionId: number,
  payload: { winnerId: number | null; winningBid: number },
): void {
  getIo()
    .to(auctionRoom(auctionId))
    .emit(AUCTION_ENDED, { auctionId, ...payload });
}

/** Sends an outbid alert only to the affected user (any page they're on). */
export function emitOutbidAlert(
  userId: number,
  payload: { auctionId: number; auctionTitle: string; newAmount: number },
): void {
  getIo().to(userRoom(userId)).emit(OUTBID_ALERT, payload);
}
