import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as categoryModel from '../models/categoryModel';

export const listCategories = catchAsync(async (_req: Request, res: Response) => {
  const rows = await categoryModel.findAll();
  res.json({ success: true, data: { categories: rows.map(categoryModel.toPublicCategory) } });
});
