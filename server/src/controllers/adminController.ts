import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as fraudModel from '../models/fraudModel';
import * as userModel from '../models/userModel';
import * as lifecycle from '../services/auctionLifecycleService';
import * as analyticsService from '../services/analyticsService';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid id', 400);
  return id;
}

export const listFraudSignals = catchAsync(async (req: Request, res: Response) => {
  const includeResolved = req.query.includeResolved === 'true';
  const rows = await fraudModel.list(includeResolved);
  res.json({ success: true, data: { signals: rows.map(fraudModel.toPublic) } });
});

export const resolveFraudSignal = catchAsync(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const ok = await fraudModel.resolve(id, req.user!.id);
  if (!ok) throw new AppError('Signal not found or already resolved', 404);
  res.json({ success: true, message: 'Signal resolved' });
});

export const suspendAuction = catchAsync(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const newState = await lifecycle.suspendAuction(id, req.user!.id);
  res.json({ success: true, data: { auctionId: id, state: newState }, message: 'Auction suspended' });
});

export const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === req.user!.id) throw new AppError('You cannot suspend your own account', 400);

  const target = await userModel.findById(id);
  if (!target) throw new AppError('User not found', 404);
  if (target.role === 'admin') throw new AppError('Cannot suspend an admin account', 403);

  // Default action is to suspend; pass { suspended: false } to reinstate.
  const suspended = req.body.suspended !== false;
  const reason = typeof req.body.reason === 'string' ? req.body.reason : null;
  await userModel.setSuspended(id, suspended, reason);
  res.json({
    success: true,
    data: { userId: id, suspended },
    message: suspended ? 'User suspended' : 'User reinstated',
  });
});

export const analyticsOverview = catchAsync(async (_req: Request, res: Response) => {
  const data = await analyticsService.platformOverview();
  res.json({ success: true, data });
});
