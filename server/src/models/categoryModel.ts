import type { RowDataPacket } from 'mysql2';
import { pool } from './db';

/** Category row as stored in the database. */
export interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  parent_id: number | null;
  created_at: Date;
}

/** Public-facing category shape. */
export interface PublicCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  parentId: number | null;
}

export function toPublicCategory(row: CategoryRow): PublicCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    iconUrl: row.icon_url,
    parentId: row.parent_id,
  };
}

export async function findAll(): Promise<CategoryRow[]> {
  const [rows] = await pool.query<CategoryRow[]>('SELECT * FROM categories ORDER BY name ASC');
  return rows;
}

export async function findById(id: number): Promise<CategoryRow | null> {
  const [rows] = await pool.query<CategoryRow[]>('SELECT * FROM categories WHERE id = ? LIMIT 1', [
    id,
  ]);
  return rows[0] ?? null;
}
