import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

export type FraudSignalType =
  | 'same_ip'
  | 'min_increment_pattern'
  | 'bid_retract_pattern'
  | 'new_account_high_value'
  | 'velocity_spike';

export interface FraudSignalRow extends RowDataPacket {
  id: number;
  auction_id: number;
  signal_type: FraudSignalType;
  description: string;
  risk_score: number;
  flagged_user_id: number | null;
  is_resolved: number;
  resolved_by: number | null;
  created_at: Date;
  // joined
  auction_title?: string;
  flagged_username?: string | null;
}

export interface PublicFraudSignal {
  id: number;
  auctionId: number;
  auctionTitle: string | null;
  signalType: FraudSignalType;
  description: string;
  riskScore: number;
  flaggedUserId: number | null;
  flaggedUsername: string | null;
  isResolved: boolean;
  createdAt: Date;
}

export function toPublic(row: FraudSignalRow): PublicFraudSignal {
  return {
    id: row.id,
    auctionId: row.auction_id,
    auctionTitle: row.auction_title ?? null,
    signalType: row.signal_type,
    description: row.description,
    riskScore: Number(row.risk_score),
    flaggedUserId: row.flagged_user_id,
    flaggedUsername: row.flagged_username ?? null,
    isResolved: Boolean(row.is_resolved),
    createdAt: row.created_at,
  };
}

export interface CreateSignalInput {
  auctionId: number;
  signalType: FraudSignalType;
  description: string;
  riskScore: number;
  flaggedUserId: number | null;
}

export async function create(input: CreateSignalInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO fraud_signals (auction_id, signal_type, description, risk_score, flagged_user_id)
     VALUES (?, ?, ?, ?, ?)`,
    [input.auctionId, input.signalType, input.description, input.riskScore, input.flaggedUserId],
  );
  return result.insertId;
}

/**
 * Whether an unresolved signal of this type already exists for the auction (and
 * optional user) — used to avoid re-flagging the same pattern on every bid.
 */
export async function existsUnresolved(
  auctionId: number,
  signalType: FraudSignalType,
  flaggedUserId: number | null,
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM fraud_signals
     WHERE auction_id = ? AND signal_type = ? AND is_resolved = FALSE
       AND (flagged_user_id <=> ?)
     LIMIT 1`,
    [auctionId, signalType, flaggedUserId],
  );
  return rows.length > 0;
}

/** Flagged signals ordered by risk (unresolved first) for the admin dashboard. */
export async function list(includeResolved: boolean): Promise<FraudSignalRow[]> {
  const where = includeResolved ? '' : 'WHERE f.is_resolved = FALSE';
  const [rows] = await pool.query<FraudSignalRow[]>(
    `SELECT f.*, a.title AS auction_title, u.username AS flagged_username
     FROM fraud_signals f
     JOIN auctions a ON a.id = f.auction_id
     LEFT JOIN users u ON u.id = f.flagged_user_id
     ${where}
     ORDER BY f.is_resolved ASC, f.risk_score DESC, f.created_at DESC
     LIMIT 200`,
  );
  return rows;
}

export async function resolve(id: number, resolvedBy: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE fraud_signals SET is_resolved = TRUE, resolved_by = ? WHERE id = ? AND is_resolved = FALSE',
    [resolvedBy, id],
  );
  return result.affectedRows > 0;
}
