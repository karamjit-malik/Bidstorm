import { AppError } from '../utils/AppError';
import { config } from '../config';
import * as auctionModel from '../models/auctionModel';
import * as categoryModel from '../models/categoryModel';
import * as imageModel from '../models/auctionImageModel';
import * as lifecycle from './auctionLifecycleService';
import { processAuctionImage, removeImageFiles } from './imageService';
import type { AuctionState, AuthUser } from '../types';
import type { AuctionRow, PublicAuctionSummary } from '../models/auctionModel';
import type { PublicAuctionImage } from '../models/auctionImageModel';

/**
 * Self-healing lifecycle guard: if a LIVE/EXTENDING auction is past its end
 * time, settle it on read (via the shared lifecycle service). This keeps state,
 * badge, countdown, and the bid box consistent even between scheduler ticks.
 * Returns the effective (possibly refreshed) row.
 */
async function settleIfExpired(row: AuctionRow): Promise<AuctionRow> {
  const active = row.state === 'LIVE' || row.state === 'EXTENDING';
  if (!active || new Date(row.end_time).getTime() > Date.now()) return row;

  await lifecycle.endAuction(row.id);
  const fresh = await auctionModel.findById(row.id);
  return fresh ?? row;
}

export interface CreateAuctionInput {
  categoryId: number;
  title: string;
  description: string;
  startingPrice: number;
  reservePrice?: number | null;
  minBidIncrement?: number;
  startTime: string; // ISO
  endTime: string; // ISO
  antiSnipeSeconds?: number;
  extensionSeconds?: number;
}

/** Full detail shape returned by GET /:id. */
export interface PublicAuctionDetail extends PublicAuctionSummary {
  sellerId: number;
  originalEndTime: Date;
  antiSnipeSeconds: number;
  extensionSeconds: number;
  winnerId: number | null;
  createdAt: Date;
  images: PublicAuctionImage[];
}

function detailFrom(row: AuctionRow, images: PublicAuctionImage[]): PublicAuctionDetail {
  const thumb = images[0]?.thumbnailUrl ?? null;
  return {
    ...auctionModel.toSummary(row, thumb),
    sellerId: row.seller_id,
    originalEndTime: row.original_end_time,
    antiSnipeSeconds: row.anti_snipe_seconds,
    extensionSeconds: row.extension_seconds,
    winnerId: row.winner_id,
    createdAt: row.created_at,
    images,
  };
}

function validateTimes(start: Date, end: Date): void {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Invalid start or end time', 400);
  }
  if (end <= start) {
    throw new AppError('End time must be after start time', 400);
  }
}

export async function createAuction(
  sellerId: number,
  input: CreateAuctionInput,
): Promise<PublicAuctionDetail> {
  const category = await categoryModel.findById(input.categoryId);
  if (!category) throw new AppError('Category not found', 400);

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);
  validateTimes(startTime, endTime);

  if (input.startingPrice <= 0) throw new AppError('Starting price must be positive', 400);
  if (input.reservePrice != null && input.reservePrice < input.startingPrice) {
    throw new AppError('Reserve price cannot be below the starting price', 400);
  }

  const id = await auctionModel.createAuction({
    sellerId,
    categoryId: input.categoryId,
    title: input.title.trim(),
    description: input.description.trim(),
    startingPrice: input.startingPrice,
    reservePrice: input.reservePrice ?? null,
    minBidIncrement: input.minBidIncrement ?? 1,
    startTime,
    endTime,
    antiSnipeSeconds: input.antiSnipeSeconds ?? 30,
    extensionSeconds: input.extensionSeconds ?? 120,
  });

  const row = await auctionModel.findById(id);
  if (!row) throw new AppError('Failed to create auction', 500);
  return detailFrom(row, []);
}

export async function getAuctionDetail(id: number): Promise<PublicAuctionDetail> {
  let row = await auctionModel.findById(id);
  if (!row) throw new AppError('Auction not found', 404);
  row = await settleIfExpired(row);
  const images = (await imageModel.findByAuction(id)).map(imageModel.toPublicImage);
  return detailFrom(row, images);
}

export interface ListQuery {
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  state?: AuctionState;
  search?: string;
  cursor?: number;
  limit?: number;
}

export interface ListResponse {
  items: PublicAuctionSummary[];
  nextCursor: number | null;
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export async function listAuctions(query: ListQuery): Promise<ListResponse> {
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  const { rows, nextCursor } = await auctionModel.listAuctions({
    categoryId: query.categoryId,
    priceMin: query.priceMin,
    priceMax: query.priceMax,
    state: query.state,
    search: query.search,
    cursor: query.cursor,
    limit,
  });

  // Settle any expired auctions on this page so badges reflect reality
  // (bounded by page size).
  const settled = await Promise.all(rows.map((r) => settleIfExpired(r)));

  const thumbs = await thumbnailMap(settled.map((r) => r.id));
  const items = settled.map((r) => auctionModel.toSummary(r, thumbs.get(r.id) ?? null));
  return { items, nextCursor };
}

export async function listSellerAuctions(sellerId: number): Promise<PublicAuctionSummary[]> {
  const rows = await auctionModel.findBySeller(sellerId);
  const thumbs = await thumbnailMap(rows.map((r) => r.id));
  return rows.map((r) => auctionModel.toSummary(r, thumbs.get(r.id) ?? null));
}

/** Map of auctionId -> first thumbnail URL, batched to avoid N+1. */
async function thumbnailMap(auctionIds: number[]): Promise<Map<number, string>> {
  const images = await imageModel.findByAuctionIds(auctionIds);
  const map = new Map<number, string>();
  for (const img of images) {
    if (!map.has(img.auction_id)) map.set(img.auction_id, img.thumbnail_url);
  }
  return map;
}

/** Loads an auction and asserts the actor owns it. Used before mutations. */
async function loadOwned(auctionId: number, user: AuthUser): Promise<AuctionRow> {
  const row = await auctionModel.findById(auctionId);
  if (!row) throw new AppError('Auction not found', 404);
  if (row.seller_id !== user.id && user.role !== 'admin') {
    throw new AppError('You do not own this auction', 403);
  }
  return row;
}

function assertDraft(row: AuctionRow): void {
  if (row.state !== 'DRAFT') {
    throw new AppError('Only auctions in DRAFT state can be modified', 409);
  }
}

export interface UpdateAuctionInput {
  categoryId?: number;
  title?: string;
  description?: string;
  startingPrice?: number;
  reservePrice?: number | null;
  minBidIncrement?: number;
  startTime?: string;
  endTime?: string;
  antiSnipeSeconds?: number;
  extensionSeconds?: number;
}

export async function updateAuction(
  auctionId: number,
  user: AuthUser,
  input: UpdateAuctionInput,
): Promise<PublicAuctionDetail> {
  const row = await loadOwned(auctionId, user);
  assertDraft(row);

  if (input.categoryId !== undefined) {
    const category = await categoryModel.findById(input.categoryId);
    if (!category) throw new AppError('Category not found', 400);
  }

  const startTime = input.startTime ? new Date(input.startTime) : row.start_time;
  const endTime = input.endTime ? new Date(input.endTime) : row.end_time;
  if (input.startTime || input.endTime) validateTimes(startTime, endTime);

  const startingPrice = input.startingPrice ?? Number(row.starting_price);
  const reserve = input.reservePrice !== undefined ? input.reservePrice : row.reserve_price;
  if (input.startingPrice !== undefined && input.startingPrice <= 0) {
    throw new AppError('Starting price must be positive', 400);
  }
  if (reserve != null && Number(reserve) < startingPrice) {
    throw new AppError('Reserve price cannot be below the starting price', 400);
  }

  await auctionModel.updateAuction(auctionId, {
    categoryId: input.categoryId,
    title: input.title?.trim(),
    description: input.description?.trim(),
    startingPrice: input.startingPrice,
    reservePrice: input.reservePrice,
    minBidIncrement: input.minBidIncrement,
    startTime: input.startTime ? startTime : undefined,
    endTime: input.endTime ? endTime : undefined,
    antiSnipeSeconds: input.antiSnipeSeconds,
    extensionSeconds: input.extensionSeconds,
  });

  return getAuctionDetail(auctionId);
}

export async function deleteAuction(auctionId: number, user: AuthUser): Promise<void> {
  const row = await loadOwned(auctionId, user);
  assertDraft(row);

  // Remove image files best-effort before the DB cascade drops the rows.
  const images = await imageModel.findByAuction(auctionId);
  await Promise.all(images.map((img) => removeImageFiles(img.image_url, img.thumbnail_url)));

  await auctionModel.deleteAuction(auctionId);
}

/** Publishes a DRAFT auction: DRAFT -> SCHEDULED. Requires at least one image. */
export async function publishAuction(
  auctionId: number,
  user: AuthUser,
): Promise<PublicAuctionDetail> {
  const row = await loadOwned(auctionId, user);
  assertDraft(row);

  const imageCount = await imageModel.countByAuction(auctionId);
  if (imageCount === 0) {
    throw new AppError('Add at least one image before publishing', 400);
  }
  if (new Date(row.end_time) <= new Date()) {
    throw new AppError('End time must be in the future to publish', 400);
  }

  await auctionModel.setState(auctionId, 'SCHEDULED');
  return getAuctionDetail(auctionId);
}

export async function addImages(
  auctionId: number,
  user: AuthUser,
  files: Express.Multer.File[],
): Promise<PublicAuctionImage[]> {
  const row = await loadOwned(auctionId, user);
  assertDraft(row);

  if (files.length === 0) throw new AppError('No image files provided', 400);

  const existing = await imageModel.countByAuction(auctionId);
  if (existing + files.length > config.upload.maxFilesPerAuction) {
    throw new AppError(
      `An auction may have at most ${config.upload.maxFilesPerAuction} images`,
      400,
    );
  }

  let sortOrder = (await imageModel.maxSortOrder(auctionId)) + 1;
  const created: PublicAuctionImage[] = [];
  for (const file of files) {
    const processed = await processAuctionImage(auctionId, file.buffer);
    const id = await imageModel.insertImage({
      auctionId,
      imageUrl: processed.imageUrl,
      thumbnailUrl: processed.thumbnailUrl,
      sortOrder,
    });
    created.push({
      id,
      imageUrl: processed.imageUrl,
      thumbnailUrl: processed.thumbnailUrl,
      sortOrder,
    });
    sortOrder += 1;
  }
  return created;
}

export async function removeImage(
  auctionId: number,
  imageId: number,
  user: AuthUser,
): Promise<void> {
  const row = await loadOwned(auctionId, user);
  assertDraft(row);

  const image = await imageModel.findById(imageId);
  if (!image || image.auction_id !== auctionId) {
    throw new AppError('Image not found', 404);
  }

  await imageModel.deleteById(imageId);
  await removeImageFiles(image.image_url, image.thumbnail_url);
}
