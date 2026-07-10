import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as auctionService from '../services/auctionService';
import type { AuctionState } from '../types';

function optInt(value: unknown): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function optFloat(value: unknown): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

const VALID_STATES: AuctionState[] = [
  'SCHEDULED',
  'LIVE',
  'EXTENDING',
  'ENDED',
  'SETTLING',
  'COMPLETED',
];

export const listAuctions = catchAsync(async (req: Request, res: Response) => {
  const q = req.query;
  const stateParam = typeof q.state === 'string' ? (q.state as AuctionState) : undefined;
  const state = stateParam && VALID_STATES.includes(stateParam) ? stateParam : undefined;

  const result = await auctionService.listAuctions({
    categoryId: optInt(q.categoryId),
    priceMin: optFloat(q.priceMin),
    priceMax: optFloat(q.priceMax),
    state,
    search: typeof q.search === 'string' && q.search.trim() ? q.search.trim() : undefined,
    cursor: optInt(q.cursor),
    limit: optInt(q.limit),
  });

  res.json({ success: true, data: result });
});

export const getAuction = catchAsync(async (req: Request, res: Response) => {
  const id = optInt(req.params.id);
  if (id === undefined) throw new AppError('Invalid auction id', 400);
  const auction = await auctionService.getAuctionDetail(id);
  res.json({ success: true, data: { auction } });
});

export const createAuction = catchAsync(async (req: Request, res: Response) => {
  const auction = await auctionService.createAuction(req.user!.id, req.body);
  res.status(201).json({ success: true, data: { auction } });
});

export const updateAuction = catchAsync(async (req: Request, res: Response) => {
  const id = optInt(req.params.id);
  if (id === undefined) throw new AppError('Invalid auction id', 400);
  const auction = await auctionService.updateAuction(id, req.user!, req.body);
  res.json({ success: true, data: { auction } });
});

export const deleteAuction = catchAsync(async (req: Request, res: Response) => {
  const id = optInt(req.params.id);
  if (id === undefined) throw new AppError('Invalid auction id', 400);
  await auctionService.deleteAuction(id, req.user!);
  res.json({ success: true, message: 'Auction deleted' });
});

export const publishAuction = catchAsync(async (req: Request, res: Response) => {
  const id = optInt(req.params.id);
  if (id === undefined) throw new AppError('Invalid auction id', 400);
  const auction = await auctionService.publishAuction(id, req.user!);
  res.json({ success: true, data: { auction } });
});

export const uploadImages = catchAsync(async (req: Request, res: Response) => {
  const id = optInt(req.params.id);
  if (id === undefined) throw new AppError('Invalid auction id', 400);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const images = await auctionService.addImages(id, req.user!, files);
  res.status(201).json({ success: true, data: { images } });
});

export const deleteImage = catchAsync(async (req: Request, res: Response) => {
  const id = optInt(req.params.id);
  const imageId = optInt(req.params.imageId);
  if (id === undefined || imageId === undefined) throw new AppError('Invalid id', 400);
  await auctionService.removeImage(id, imageId, req.user!);
  res.json({ success: true, message: 'Image removed' });
});

export const listMyAuctions = catchAsync(async (req: Request, res: Response) => {
  const items = await auctionService.listSellerAuctions(req.user!.id);
  res.json({ success: true, data: { items } });
});
