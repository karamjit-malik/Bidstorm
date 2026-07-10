import { api } from './api';
import type { ApiResponse } from '../types/user';
import type { AuctionSummary } from '../types/auction';

export interface RecommendationItem extends AuctionSummary {
  reason?: 'cold_start' | 'collaborative' | 'trending';
}

export async function getForYou(): Promise<RecommendationItem[]> {
  const res = await api.get<ApiResponse<{ items: RecommendationItem[] }>>(
    '/recommendations/for-you',
  );
  return res.data.data!.items;
}

export async function getTrending(): Promise<AuctionSummary[]> {
  const res = await api.get<ApiResponse<{ items: AuctionSummary[] }>>('/recommendations/trending');
  return res.data.data!.items;
}

export async function getSimilar(auctionId: number): Promise<AuctionSummary[]> {
  const res = await api.get<ApiResponse<{ items: AuctionSummary[] }>>(
    `/recommendations/similar/${auctionId}`,
  );
  return res.data.data!.items;
}
