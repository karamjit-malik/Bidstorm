import { api } from './api';
import type { ApiResponse } from '../types/user';

export type FraudSignalType =
  | 'same_ip'
  | 'min_increment_pattern'
  | 'bid_retract_pattern'
  | 'new_account_high_value'
  | 'velocity_spike';

export interface FraudSignal {
  id: number;
  auctionId: number;
  auctionTitle: string | null;
  signalType: FraudSignalType;
  description: string;
  riskScore: number;
  flaggedUserId: number | null;
  flaggedUsername: string | null;
  isResolved: boolean;
  createdAt: string;
}

export interface PlatformOverview {
  totals: {
    users: number;
    auctions: number;
    bids: number;
    grossMerchandiseValue: number;
    activeAuctions: number;
    openFraudSignals: number;
  };
  auctionsByState: { state: string; count: number }[];
  topCategories: { category: string; count: number }[];
}

export async function getOverview(): Promise<PlatformOverview> {
  const res = await api.get<ApiResponse<PlatformOverview>>('/admin/analytics/overview');
  return res.data.data!;
}

export async function getFraudSignals(includeResolved = false): Promise<FraudSignal[]> {
  const res = await api.get<ApiResponse<{ signals: FraudSignal[] }>>('/admin/fraud-signals', {
    params: { includeResolved },
  });
  return res.data.data!.signals;
}

export async function resolveFraudSignal(id: number): Promise<void> {
  await api.patch(`/admin/fraud-signals/${id}/resolve`);
}

export async function suspendAuction(auctionId: number): Promise<void> {
  await api.post(`/admin/auctions/${auctionId}/suspend`);
}

export async function suspendUser(userId: number, suspended = true): Promise<void> {
  await api.post(`/admin/users/${userId}/suspend`, { suspended });
}
