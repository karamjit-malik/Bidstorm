export interface Bid {
  id: number;
  auctionId: number;
  bidderId: number;
  bidderUsername: string;
  amount: number;
  isWinning: boolean;
  isRetracted: boolean;
  createdAt: string;
}

export interface MyBid extends Bid {
  auctionTitle: string | null;
  auctionState: string | null;
}

// --- Socket event payloads (mirror server/src/socket/events.ts) ---
export interface NewBidEvent {
  bidId: number;
  amount: number;
  bidderUsername: string;
  bidCount: number;
  timestamp: string;
}

export interface BidRetractedEvent {
  bidId: number;
  newCurrentBid: number;
}

export interface AntiSnipeEvent {
  auctionId: number;
  newEndTime: string;
  extensionSeconds: number;
}

export interface TimerSyncEvent {
  serverTime: string;
  endTime: string | null;
  auctionId: number;
}

export interface WatcherUpdateEvent {
  auctionId: number;
  watcherCount: number;
}

export interface OutbidEvent {
  auctionId: number;
  auctionTitle: string;
  newAmount: number;
}

export interface AuctionStateChangeEvent {
  auctionId: number;
  newState: string;
  endTime?: string;
}

export interface AuctionEndedEvent {
  auctionId: number;
  winnerId: number | null;
  winningBid: number;
}
