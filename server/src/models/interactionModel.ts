import type { PoolConnection } from 'mysql2/promise';
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
