import { api } from './api';
import type { ApiResponse } from '../types/user';
import type { Category } from '../types/auction';

export async function listCategories(): Promise<Category[]> {
  const res = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
  return res.data.data!.categories;
}
