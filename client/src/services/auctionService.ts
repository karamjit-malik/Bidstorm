import { api } from './api';
import type { ApiResponse } from '../types/user';
import type {
  AuctionDetail,
  AuctionFilters,
  AuctionImage,
  AuctionListResponse,
  AuctionSummary,
} from '../types/auction';

export interface CreateAuctionPayload {
  categoryId: number;
  title: string;
  description: string;
  startingPrice: number;
  reservePrice?: number | null;
  minBidIncrement?: number;
  startTime: string;
  endTime: string;
  antiSnipeSeconds?: number;
  extensionSeconds?: number;
}

export type UpdateAuctionPayload = Partial<CreateAuctionPayload>;

export async function listAuctions(filters: AuctionFilters = {}): Promise<AuctionListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.categoryId != null) params.categoryId = filters.categoryId;
  if (filters.priceMin != null) params.priceMin = filters.priceMin;
  if (filters.priceMax != null) params.priceMax = filters.priceMax;
  if (filters.state) params.state = filters.state;
  if (filters.search) params.search = filters.search;
  if (filters.cursor != null) params.cursor = filters.cursor;
  if (filters.limit != null) params.limit = filters.limit;

  const res = await api.get<ApiResponse<AuctionListResponse>>('/auctions', { params });
  return res.data.data!;
}

export async function getAuction(id: number): Promise<AuctionDetail> {
  const res = await api.get<ApiResponse<{ auction: AuctionDetail }>>(`/auctions/${id}`);
  return res.data.data!.auction;
}

export async function createAuction(payload: CreateAuctionPayload): Promise<AuctionDetail> {
  const res = await api.post<ApiResponse<{ auction: AuctionDetail }>>('/auctions', payload);
  return res.data.data!.auction;
}

export async function updateAuction(
  id: number,
  payload: UpdateAuctionPayload,
): Promise<AuctionDetail> {
  const res = await api.patch<ApiResponse<{ auction: AuctionDetail }>>(`/auctions/${id}`, payload);
  return res.data.data!.auction;
}

export async function deleteAuction(id: number): Promise<void> {
  await api.delete(`/auctions/${id}`);
}

export async function publishAuction(id: number): Promise<AuctionDetail> {
  const res = await api.post<ApiResponse<{ auction: AuctionDetail }>>(`/auctions/${id}/publish`);
  return res.data.data!.auction;
}

export async function uploadImages(id: number, files: File[]): Promise<AuctionImage[]> {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  const res = await api.post<ApiResponse<{ images: AuctionImage[] }>>(
    `/auctions/${id}/images`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data!.images;
}

export async function deleteImage(id: number, imageId: number): Promise<void> {
  await api.delete(`/auctions/${id}/images/${imageId}`);
}

export async function listMyAuctions(): Promise<AuctionSummary[]> {
  const res = await api.get<ApiResponse<{ items: AuctionSummary[] }>>('/auctions/mine');
  return res.data.data!.items;
}
