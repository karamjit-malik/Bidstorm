import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

export type EscrowStatus = 'pending' | 'paid' | 'released' | 'refunded' | 'disputed';

export interface EscrowRow extends RowDataPacket {
  id: number;
  auction_id: number;
  buyer_id: number;
  seller_id: number;
  amount: number;
  payment_gateway_id: string | null;
  status: EscrowStatus;
  paid_at: Date | null;
  released_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEscrowInput {
  auctionId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
}

/**
 * Creates the escrow record for a settled auction. Idempotent: the auction has
 * a UNIQUE key, so a duplicate insert (e.g. from a re-run job) is ignored.
 * Returns true if a row was inserted.
 */
export async function createIfAbsent(input: CreateEscrowInput): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO payment_escrow (auction_id, buyer_id, seller_id, amount, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [input.auctionId, input.buyerId, input.sellerId, input.amount],
  );
  return result.affectedRows > 0;
}

export async function findByAuction(auctionId: number): Promise<EscrowRow | null> {
  const [rows] = await pool.query<EscrowRow[]>(
    'SELECT * FROM payment_escrow WHERE auction_id = ? LIMIT 1',
    [auctionId],
  );
  return rows[0] ?? null;
}

/** Pending escrows older than `hours` — used by the settlement-timeout job. */
export async function findStalePending(hours: number): Promise<EscrowRow[]> {
  const [rows] = await pool.query<EscrowRow[]>(
    `SELECT * FROM payment_escrow
     WHERE status = 'pending' AND created_at < (UTC_TIMESTAMP() - INTERVAL ? HOUR)`,
    [hours],
  );
  return rows;
}

export async function setStatus(id: number, status: EscrowStatus): Promise<void> {
  await pool.query('UPDATE payment_escrow SET status = ? WHERE id = ?', [status, id]);
}
