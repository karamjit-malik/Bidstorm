import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as categoryModel from '../models/categoryModel';
import * as preferenceModel from '../models/preferenceModel';

export const listCategories = catchAsync(async (_req: Request, res: Response) => {
  const rows = await categoryModel.findAll();
  res.json({ success: true, data: { categories: rows.map(categoryModel.toPublicCategory) } });
});

/** Onboarding: set the user's preferred categories (drives cold-start recs). */
export const setPreferences = catchAsync(async (req: Request, res: Response) => {
  const raw = req.body.categoryIds;
  if (!Array.isArray(raw)) throw new AppError('categoryIds must be an array', 400);
  const ids = raw.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  await preferenceModel.setPreferences(req.user!.id, [...new Set(ids)]);
  res.json({ success: true, data: { categoryIds: [...new Set(ids)] } });
});

export const getPreferences = catchAsync(async (req: Request, res: Response) => {
  const rows = await preferenceModel.getPreferences(req.user!.id);
  res.json({
    success: true,
    data: { categoryIds: rows.map((r) => Number(r.category_id)) },
  });
});
