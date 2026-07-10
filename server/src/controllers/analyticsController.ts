import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as analyticsService from '../services/analyticsService';

/** Seller-scoped analytics for the seller dashboard charts. */
export const getSellerAnalytics = catchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.sellerAnalytics(req.user!.id);
  res.json({ success: true, data });
});
