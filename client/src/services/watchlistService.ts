import { api } from './api';
import type { ApiResponse } from '../types/user';
import type { AuctionSummary } from '../types/auction';

export async function getWatchlist(): Promise<AuctionSummary[]> {
  const res = await api.get<ApiResponse<{ items: AuctionSummary[] }>>('/watchlist');
  return res.data.data!.items;
}

export async function addToWatchlist(auctionId: number): Promise<void> {
  await api.post(`/watchlist/${auctionId}`);
}

export async function removeFromWatchlist(auctionId: number): Promise<void> {
  await api.delete(`/watchlist/${auctionId}`);
}
