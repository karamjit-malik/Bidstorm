import { api } from './api';
import type { ApiResponse } from '../types/user';

export interface SellerAnalytics {
  summary: {
    totalAuctions: number;
    activeAuctions: number;
    soldAuctions: number;
    totalRevenue: number;
    totalBids: number;
  };
  revenueByDay: { date: string; revenue: number }[];
  bidsByHour: { hour: number; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export async function getSellerAnalytics(): Promise<SellerAnalytics> {
  const res = await api.get<ApiResponse<SellerAnalytics>>('/analytics/seller');
  return res.data.data!;
}
