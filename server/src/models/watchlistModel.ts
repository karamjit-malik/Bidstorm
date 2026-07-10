import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

/** Adds to watchlist. Returns true if newly added (false if it already existed). */
export async function add(userId: number, auctionId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT IGNORE INTO watchlist (user_id, auction_id) VALUES (?, ?)',
    [userId, auctionId],
  );
  return result.affectedRows > 0;
}

export async function remove(userId: number, auctionId: number): Promise<void> {
  await pool.query('DELETE FROM watchlist WHERE user_id = ? AND auction_id = ?', [
    userId,
    auctionId,
  ]);
}

export async function auctionIdsForUser(userId: number): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT auction_id FROM watchlist WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return rows.map((r) => Number(r.auction_id));
}

export async function isWatching(userId: number, auctionId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM watchlist WHERE user_id = ? AND auction_id = ? LIMIT 1',
    [userId, auctionId],
  );
  return rows.length > 0;
}
