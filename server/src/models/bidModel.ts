import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

export interface BidRow extends RowDataPacket {
  id: number;
  auction_id: number;
  bidder_id: number;
  amount: number;
  bid_version: number;
  ip_address: string | null;
  is_winning: number;
  is_retracted: number;
  created_at: Date;
  // joined
  bidder_username?: string;
  auction_title?: string;
  auction_state?: string;
}

export interface PublicBid {
  id: number;
  auctionId: number;
  bidderId: number;
  bidderUsername: string;
  amount: number;
  isWinning: boolean;
  isRetracted: boolean;
  createdAt: Date;
}

export function toPublicBid(row: BidRow): PublicBid {
  return {
    id: row.id,
    auctionId: row.auction_id,
    bidderId: row.bidder_id,
    bidderUsername: row.bidder_username ?? '',
    amount: Number(row.amount),
    isWinning: Boolean(row.is_winning),
    isRetracted: Boolean(row.is_retracted),
    createdAt: row.created_at,
  };
}

export interface InsertBidInput {
  auctionId: number;
  bidderId: number;
  amount: number;
  bidVersion: number;
  ipAddress: string | null;
}

/** Inserts a bid and flags it winning. Caller clears the prior winner first. */
export async function insertBid(conn: PoolConnection, input: InsertBidInput): Promise<number> {
  const [result] = await conn.query<ResultSetHeader>(
    `INSERT INTO bids (auction_id, bidder_id, amount, bid_version, ip_address, is_winning)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [input.auctionId, input.bidderId, input.amount, input.bidVersion, input.ipAddress],
  );
  return result.insertId;
}

/** The current winning (non-retracted) bid for an auction, if any. */
export async function findWinningBid(
  auctionId: number,
  conn: PoolConnection | typeof pool = pool,
): Promise<BidRow | null> {
  const [rows] = await conn.query<BidRow[]>(
    `SELECT * FROM bids
     WHERE auction_id = ? AND is_winning = TRUE AND is_retracted = FALSE
     LIMIT 1`,
    [auctionId],
  );
  return rows[0] ?? null;
}

/** Clears the winning flag for all of an auction's bids (before a new winner). */
export async function clearWinningFlag(auctionId: number, conn: PoolConnection): Promise<void> {
  await conn.query('UPDATE bids SET is_winning = FALSE WHERE auction_id = ?', [auctionId]);
}

/** Full bid history for an auction (most recent first), with bidder usernames. */
export async function findByAuction(auctionId: number, limit = 50): Promise<BidRow[]> {
  const [rows] = await pool.query<BidRow[]>(
    `SELECT b.*, u.username AS bidder_username
     FROM bids b JOIN users u ON u.id = b.bidder_id
     WHERE b.auction_id = ?
     ORDER BY b.created_at DESC, b.id DESC
     LIMIT ?`,
    [auctionId, limit],
  );
  return rows;
}

/** All bids placed by a user, newest first, with auction context. */
export async function findByBidder(bidderId: number): Promise<BidRow[]> {
  const [rows] = await pool.query<BidRow[]>(
    `SELECT b.*, a.title AS auction_title, a.state AS auction_state
     FROM bids b JOIN auctions a ON a.id = b.auction_id
     WHERE b.bidder_id = ?
     ORDER BY b.created_at DESC, b.id DESC`,
    [bidderId],
  );
  return rows;
}

export async function findById(id: number): Promise<BidRow | null> {
  const [rows] = await pool.query<BidRow[]>('SELECT * FROM bids WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function markRetracted(bidId: number, conn: PoolConnection): Promise<void> {
  await conn.query('UPDATE bids SET is_retracted = TRUE, is_winning = FALSE WHERE id = ?', [bidId]);
}

/** Most recent (non-retracted) bid time per auction, for trending decay. */
export async function lastBidTimes(auctionIds: number[]): Promise<Map<number, Date>> {
  const map = new Map<number, Date>();
  if (auctionIds.length === 0) return map;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT auction_id, MAX(created_at) AS last_bid FROM bids
     WHERE auction_id IN (?) AND is_retracted = FALSE GROUP BY auction_id`,
    [auctionIds],
  );
  for (const r of rows) map.set(Number(r.auction_id), new Date(r.last_bid as string));
  return map;
}

/** Highest non-retracted bid for an auction, used to recompute state after a retract. */
export async function findHighestActiveBid(
  auctionId: number,
  conn: PoolConnection | typeof pool = pool,
): Promise<BidRow | null> {
  const [rows] = await conn.query<BidRow[]>(
    `SELECT * FROM bids
     WHERE auction_id = ? AND is_retracted = FALSE
     ORDER BY amount DESC, id ASC
     LIMIT 1`,
    [auctionId],
  );
  return rows[0] ?? null;
}
