export type AuctionState =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'LIVE'
  | 'EXTENDING'
  | 'ENDED'
  | 'SETTLING'
  | 'COMPLETED';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  parentId: number | null;
}

export interface AuctionSeller {
  id: number;
  username: string;
  reputationScore: number;
}

export interface AuctionSummary {
  id: number;
  title: string;
  description: string;
  startingPrice: number;
  reservePrice: number | null;
  currentBid: number;
  minBidIncrement: number;
  bidCount: number;
  state: AuctionState;
  startTime: string;
  endTime: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  seller: AuctionSeller;
  thumbnailUrl: string | null;
}

export interface AuctionImage {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  sortOrder: number;
}

export interface AuctionDetail extends AuctionSummary {
  sellerId: number;
  originalEndTime: string;
  antiSnipeSeconds: number;
  extensionSeconds: number;
  winnerId: number | null;
  createdAt: string;
  images: AuctionImage[];
}

export interface AuctionListResponse {
  items: AuctionSummary[];
  nextCursor: number | null;
}

export interface AuctionFilters {
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  state?: AuctionState;
  search?: string;
  cursor?: number;
  limit?: number;
}
