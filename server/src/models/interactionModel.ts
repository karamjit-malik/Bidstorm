import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';
import { INTERACTION_WEIGHT, type InteractionType } from '../types';

/**
 * Records a weighted user↔auction interaction for the recommendation engine.
 * Weights come from INTERACTION_WEIGHT (view=1, watchlist=3, bid=5, won=8).
 */
export async function recordInteraction(
  userId: number,
  auctionId: number,
  type: InteractionType,
  conn: PoolConnection | typeof pool = pool,
): Promise<void> {
  await conn.query(
    `INSERT INTO user_item_interactions (user_id, auction_id, interaction_type, weight)
     VALUES (?, ?, ?, ?)`,
    [userId, auctionId, type, INTERACTION_WEIGHT[type]],
  );
}

/** Number of interactions a user has recorded (drives cold-start vs CF). */
export async function countByUser(userId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM user_item_interactions WHERE user_id = ?',
    [userId],
  );
  return Number(rows[0]?.n ?? 0);
}

/**
 * A user's strongest interaction weight per auction (max across interaction
 * types). Used both as CF "source weights" and to build interaction vectors.
 */
export async function weightsByUser(userId: number): Promise<Map<number, number>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT auction_id, MAX(weight) AS w FROM user_item_interactions
     WHERE user_id = ? GROUP BY auction_id`,
    [userId],
  );
  const map = new Map<number, number>();
  for (const r of rows) map.set(Number(r.auction_id), Number(r.w));
  return map;
}

export interface AggInteraction {
  userId: number;
  auctionId: number;
  weight: number;
}

/**
 * All interactions aggregated to the strongest weight per (user, auction).
 * This is the full matrix the nightly similarity job builds vectors from.
 */
export async function allAggregated(): Promise<AggInteraction[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id, auction_id, MAX(weight) AS w
     FROM user_item_interactions GROUP BY user_id, auction_id`,
  );
  return rows.map((r) => ({
    userId: Number(r.user_id),
    auctionId: Number(r.auction_id),
    weight: Number(r.w),
  }));
}
