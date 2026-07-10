import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

export interface AuctionImageRow extends RowDataPacket {
  id: number;
  auction_id: number;
  image_url: string;
  thumbnail_url: string;
  sort_order: number;
  created_at: Date;
}

export interface PublicAuctionImage {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  sortOrder: number;
}

export function toPublicImage(row: AuctionImageRow): PublicAuctionImage {
  return {
    id: row.id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    sortOrder: row.sort_order,
  };
}

export async function findByAuction(auctionId: number): Promise<AuctionImageRow[]> {
  const [rows] = await pool.query<AuctionImageRow[]>(
    'SELECT * FROM auction_images WHERE auction_id = ? ORDER BY sort_order ASC, id ASC',
    [auctionId],
  );
  return rows;
}

/** Loads images for many auctions at once (avoids N+1 on listing pages). */
export async function findByAuctionIds(auctionIds: number[]): Promise<AuctionImageRow[]> {
  if (auctionIds.length === 0) return [];
  const [rows] = await pool.query<AuctionImageRow[]>(
    'SELECT * FROM auction_images WHERE auction_id IN (?) ORDER BY sort_order ASC, id ASC',
    [auctionIds],
  );
  return rows;
}

export async function findById(id: number): Promise<AuctionImageRow | null> {
  const [rows] = await pool.query<AuctionImageRow[]>(
    'SELECT * FROM auction_images WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] ?? null;
}

export async function countByAuction(auctionId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM auction_images WHERE auction_id = ?',
    [auctionId],
  );
  return Number(rows[0]?.n ?? 0);
}

/** Highest existing sort_order for an auction, or -1 if none. */
export async function maxSortOrder(auctionId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COALESCE(MAX(sort_order), -1) AS m FROM auction_images WHERE auction_id = ?',
    [auctionId],
  );
  return Number(rows[0]?.m ?? -1);
}

export interface InsertImageInput {
  auctionId: number;
  imageUrl: string;
  thumbnailUrl: string;
  sortOrder: number;
}

export async function insertImage(
  input: InsertImageInput,
  conn: PoolConnection | typeof pool = pool,
): Promise<number> {
  const [result] = await conn.query<ResultSetHeader>(
    `INSERT INTO auction_images (auction_id, image_url, thumbnail_url, sort_order)
     VALUES (?, ?, ?, ?)`,
    [input.auctionId, input.imageUrl, input.thumbnailUrl, input.sortOrder],
  );
  return result.insertId;
}

export async function deleteById(id: number): Promise<void> {
  await pool.query('DELETE FROM auction_images WHERE id = ?', [id]);
}
