import type { RowDataPacket } from 'mysql2';
import { pool } from './db';

export interface RefreshTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  is_revoked: number;
  created_at: Date;
}

export async function storeRefreshToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt],
  );
}

/** Returns an active (not revoked, not expired) token row, or null. */
export async function findActiveByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
  const [rows] = await pool.query<RefreshTokenRow[]>(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = ? AND is_revoked = FALSE AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function revokeByHash(tokenHash: string): Promise<void> {
  await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = ?', [tokenHash]);
}

/** Revokes every active token for a user (used on logout-all / reuse detection). */
export async function revokeAllForUser(userId: number): Promise<void> {
  await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?', [userId]);
}
