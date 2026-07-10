import { api } from './api';
import type { ApiResponse } from '../types/user';
import type { Bid, MyBid } from '../types/bid';

export interface PlaceBidResponse {
  bid: Bid;
  auction: {
    id: number;
    currentBid: number;
    bidCount: number;
    state: string;
    endTime: string;
  };
  antiSnipe: { triggered: boolean; newEndTime?: string; extensionSeconds?: number };
}

export async function placeBid(auctionId: number, amount: number): Promise<PlaceBidResponse> {
  const res = await api.post<ApiResponse<PlaceBidResponse>>(`/bids/auctions/${auctionId}/bid`, {
    amount,
  });
  return res.data.data!;
}

export async function getBidHistory(auctionId: number): Promise<Bid[]> {
  const res = await api.get<ApiResponse<{ bids: Bid[] }>>(`/bids/auctions/${auctionId}/bids`);
  return res.data.data!.bids;
}

export async function retractBid(bidId: number, reason: string): Promise<void> {
  await api.post(`/bids/bids/${bidId}/retract`, { reason });
}

export async function getMyBids(): Promise<MyBid[]> {
  const res = await api.get<ApiResponse<{ bids: MyBid[] }>>('/bids/my-bids');
  return res.data.data!.bids;
}
