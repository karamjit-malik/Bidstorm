import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';
import type { AuctionState } from '../types';

/** Raw auctions row joined with seller + category display fields. */
export interface AuctionRow extends RowDataPacket {
  id: number;
  seller_id: number;
  category_id: number;
  title: string;
  description: string;
  starting_price: number;
  reserve_price: number | null;
  current_bid: number;
  min_bid_increment: number;
  bid_count: number;
  state: AuctionState;
  start_time: Date;
  end_time: Date;
  original_end_time: Date;
  anti_snipe_seconds: number;
  extension_seconds: number;
  winner_id: number | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  // Joined display fields
  seller_username: string;
  seller_reputation: number;
  category_name: string;
  category_slug: string;
}

export interface PublicAuctionSummary {
  id: number;
  title: string;
  description: string;
  startingPrice: number;
  reservePrice: number | null;
  currentBid: number;
  minBidIncrement: number;
  bidCount: number;
  state: AuctionState;
  startTime: Date;
  endTime: Date;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  seller: { id: number; username: string; reputationScore: number };
  thumbnailUrl: string | null;
}

export function toSummary(row: AuctionRow, thumbnailUrl: string | null): PublicAuctionSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startingPrice: Number(row.starting_price),
    reservePrice: row.reserve_price === null ? null : Number(row.reserve_price),
    currentBid: Number(row.current_bid),
    minBidIncrement: Number(row.min_bid_increment),
    bidCount: row.bid_count,
    state: row.state,
    startTime: row.start_time,
    endTime: row.end_time,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    seller: {
      id: row.seller_id,
      username: row.seller_username,
      reputationScore: Number(row.seller_reputation),
    },
    thumbnailUrl,
  };
}

const BASE_SELECT = `
  SELECT a.*,
         u.username AS seller_username,
         u.reputation_score AS seller_reputation,
         c.name AS category_name,
         c.slug AS category_slug
  FROM auctions a
  JOIN users u ON u.id = a.seller_id
  JOIN categories c ON c.id = a.category_id
`;

export async function findById(id: number): Promise<AuctionRow | null> {
  const [rows] = await pool.query<AuctionRow[]>(`${BASE_SELECT} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/** Loads many auctions by id (unordered — callers reorder as needed). */
export async function findByIds(ids: number[]): Promise<AuctionRow[]> {
  if (ids.length === 0) return [];
  const [rows] = await pool.query<AuctionRow[]>(`${BASE_SELECT} WHERE a.id IN (?)`, [ids]);
  return rows;
}

/**
 * Cold-start candidates: LIVE auctions in the given categories, soonest-ending
 * first (then most bids). Excludes the user's own auctions and any provided
 * exclusions (already-interacted). Pass empty categoryIds to ignore the filter.
 */
export async function findColdStartCandidates(opts: {
  categoryIds: number[];
  excludeAuctionIds: number[];
  excludeSellerId: number;
  limit: number;
}): Promise<AuctionRow[]> {
  const where: string[] = ["a.state IN ('LIVE','EXTENDING')", 'a.seller_id <> ?'];
  const params: unknown[] = [opts.excludeSellerId];

  if (opts.categoryIds.length > 0) {
    where.push('a.category_id IN (?)');
    params.push(opts.categoryIds);
  }
  if (opts.excludeAuctionIds.length > 0) {
    where.push('a.id NOT IN (?)');
    params.push(opts.excludeAuctionIds);
  }
  params.push(opts.limit);

  const [rows] = await pool.query<AuctionRow[]>(
    `${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY a.end_time ASC, a.bid_count DESC LIMIT ?`,
    params,
  );
  return rows;
}

/** Active auctions with bid activity, for trending computation. */
export async function findActiveWithBids(limit: number): Promise<AuctionRow[]> {
  const [rows] = await pool.query<AuctionRow[]>(
    `${BASE_SELECT} WHERE a.state IN ('LIVE','EXTENDING') AND a.bid_count > 0
     ORDER BY a.bid_count DESC LIMIT ?`,
    [limit],
  );
  return rows;
}

export interface CreateAuctionInput {
  sellerId: number;
  categoryId: number;
  title: string;
  description: string;
  startingPrice: number;
  reservePrice: number | null;
  minBidIncrement: number;
  startTime: Date;
  endTime: Date;
  antiSnipeSeconds: number;
  extensionSeconds: number;
}

export async function createAuction(input: CreateAuctionInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO auctions
      (seller_id, category_id, title, description, starting_price, reserve_price,
       current_bid, min_bid_increment, state, start_time, end_time, original_end_time,
       anti_snipe_seconds, extension_seconds)
     VALUES (?, ?, ?, ?, ?, ?, 0.00, ?, 'DRAFT', ?, ?, ?, ?, ?)`,
    [
      input.sellerId,
      input.categoryId,
      input.title,
      input.description,
      input.startingPrice,
      input.reservePrice,
      input.minBidIncrement,
      input.startTime,
      input.endTime,
      input.endTime, // original_end_time == end_time at creation
      input.antiSnipeSeconds,
      input.extensionSeconds,
    ],
  );
  return result.insertId;
}

export interface UpdateAuctionInput {
  categoryId?: number;
  title?: string;
  description?: string;
  startingPrice?: number;
  reservePrice?: number | null;
  minBidIncrement?: number;
  startTime?: Date;
  endTime?: Date;
  antiSnipeSeconds?: number;
  extensionSeconds?: number;
}

/** Updates mutable fields. Callers enforce that the auction is still in DRAFT. */
export async function updateAuction(id: number, input: UpdateAuctionInput): Promise<void> {
  const map: Record<string, unknown> = {
    category_id: input.categoryId,
    title: input.title,
    description: input.description,
    starting_price: input.startingPrice,
    reserve_price: input.reservePrice,
    min_bid_increment: input.minBidIncrement,
    start_time: input.startTime,
    anti_snipe_seconds: input.antiSnipeSeconds,
    extension_seconds: input.extensionSeconds,
  };

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val);
    }
  }
  // end_time drives original_end_time too while still in DRAFT.
  if (input.endTime !== undefined) {
    fields.push('end_time = ?', 'original_end_time = ?');
    values.push(input.endTime, input.endTime);
  }

  if (fields.length === 0) return;
  values.push(id);
  await pool.query(`UPDATE auctions SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteAuction(id: number): Promise<void> {
  await pool.query('DELETE FROM auctions WHERE id = ?', [id]);
}

/** DRAFT -> SCHEDULED when the seller publishes. */
export async function setState(
  id: number,
  state: AuctionState,
  conn: PoolConnection | typeof pool = pool,
): Promise<void> {
  await conn.query('UPDATE auctions SET state = ? WHERE id = ?', [state, id]);
}

/**
 * Atomically ends a live auction whose time is up: LIVE/EXTENDING -> toState
 * (SETTLING when there's a winner to collect payment from, else ENDED), setting
 * the winner. The WHERE guard (state + end_time in the past) makes this
 * idempotent and race-safe — only the first caller flips it; returns whether
 * this call performed the transition.
 */
export async function endExpired(
  id: number,
  toState: 'ENDED' | 'SETTLING',
  winnerId: number | null,
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE auctions SET state = ?, winner_id = ?
     WHERE id = ? AND state IN ('LIVE', 'EXTENDING') AND end_time <= UTC_TIMESTAMP()`,
    [toState, winnerId, id],
  );
  return result.affectedRows > 0;
}

/**
 * Atomically starts a scheduled auction whose start time has arrived:
 * SCHEDULED -> LIVE. Idempotent and race-safe via the guarded WHERE.
 */
export async function startLive(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE auctions SET state = 'LIVE'
     WHERE id = ? AND state = 'SCHEDULED' AND start_time <= UTC_TIMESTAMP()`,
    [id],
  );
  return result.affectedRows > 0;
}

/** IDs of auctions whose start time has arrived while still SCHEDULED. */
export async function findDueToStartIds(limit = 200): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM auctions
     WHERE state = 'SCHEDULED' AND start_time <= UTC_TIMESTAMP()
     ORDER BY start_time ASC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => r.id as number);
}

/** IDs of live auctions whose end time has passed and need settling. */
export async function findDueToEndIds(limit = 200): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM auctions
     WHERE state IN ('LIVE', 'EXTENDING') AND end_time <= UTC_TIMESTAMP()
     ORDER BY end_time ASC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => r.id as number);
}

/** Transitions an auction between arbitrary states with a from-state guard. */
export async function transition(
  id: number,
  fromState: AuctionState,
  toState: AuctionState,
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE auctions SET state = ? WHERE id = ? AND state = ?',
    [toState, id, fromState],
  );
  return result.affectedRows > 0;
}

/** Admin suspend: force a state change and clear any winner (guarded). */
export async function suspend(
  id: number,
  fromState: AuctionState,
  toState: AuctionState,
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE auctions SET state = ?, winner_id = NULL WHERE id = ? AND state = ?',
    [toState, id, fromState],
  );
  return result.affectedRows > 0;
}

/** Records an auction state transition in the audit log. */
export async function logStateChange(
  auctionId: number,
  fromState: AuctionState,
  toState: AuctionState,
  triggeredBy: 'system' | 'seller' | 'admin' | 'anti_snipe',
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await pool.query(
    `INSERT INTO auction_state_log (auction_id, from_state, to_state, triggered_by, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [auctionId, fromState, toState, triggeredBy, JSON.stringify(metadata)],
  );
}

export interface ListFilters {
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  state?: AuctionState;
  search?: string;
  sellerId?: number;
  cursor?: number; // last seen auction id (paginating by id DESC)
  limit: number;
}

export interface ListResult {
  rows: AuctionRow[];
  nextCursor: number | null;
}

/**
 * Cursor-paginated listing. Pagination key is the monotonically decreasing
 * auction id, which guarantees a stable window (no duplicates or gaps) even as
 * new auctions are created. Fetches limit+1 rows to detect a next page.
 */
export async function listAuctions(filters: ListFilters): Promise<ListResult> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.categoryId !== undefined) {
    where.push('a.category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.priceMin !== undefined) {
    where.push('GREATEST(a.current_bid, a.starting_price) >= ?');
    params.push(filters.priceMin);
  }
  if (filters.priceMax !== undefined) {
    where.push('GREATEST(a.current_bid, a.starting_price) <= ?');
    params.push(filters.priceMax);
  }
  if (filters.state !== undefined) {
    where.push('a.state = ?');
    params.push(filters.state);
  } else {
    // Public listings never surface DRAFT auctions.
    where.push("a.state <> 'DRAFT'");
  }
  if (filters.sellerId !== undefined) {
    where.push('a.seller_id = ?');
    params.push(filters.sellerId);
  }
  if (filters.search) {
    where.push('MATCH(a.title, a.description) AGAINST (? IN NATURAL LANGUAGE MODE)');
    params.push(filters.search);
  }
  if (filters.cursor !== undefined) {
    where.push('a.id < ?');
    params.push(filters.cursor);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(filters.limit + 1);

  const [rows] = await pool.query<AuctionRow[]>(
    `${BASE_SELECT} ${whereSql} ORDER BY a.id DESC LIMIT ?`,
    params,
  );

  let nextCursor: number | null = null;
  if (rows.length > filters.limit) {
    rows.pop(); // drop the look-ahead row
    // Next page uses id < nextCursor, so it's the last returned id.
    nextCursor = rows[rows.length - 1].id;
  }

  return { rows, nextCursor };
}

/** Seller dashboard: all of a seller's auctions grouped by state (incl. DRAFT). */
export async function findBySeller(sellerId: number): Promise<AuctionRow[]> {
  const [rows] = await pool.query<AuctionRow[]>(
    `${BASE_SELECT} WHERE a.seller_id = ? ORDER BY a.created_at DESC`,
    [sellerId],
  );
  return rows;
}
