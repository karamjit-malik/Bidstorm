import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from './db';
import type { UserRole } from '../types';

/** Full user row as stored in the database. */
export interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_verified: number; // MySQL BOOLEAN -> 0/1
  is_suspended: number;
  suspended_reason: string | null;
  verification_token: string | null;
  reputation_score: number;
  created_at: Date;
  updated_at: Date;
}

/** Public-facing user shape (never exposes password_hash / tokens). */
export interface PublicUser {
  id: number;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  reputationScore: number;
  createdAt: Date;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    isVerified: Boolean(row.is_verified),
    reputationScore: Number(row.reputation_score),
    createdAt: row.created_at,
  };
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ?? null;
}

export async function findByUsername(username: string): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE username = ? LIMIT 1', [
    username,
  ]);
  return rows[0] ?? null;
}

export async function findById(id: number): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function findByVerificationToken(token: string): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE verification_token = ? LIMIT 1',
    [token],
  );
  return rows[0] ?? null;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  username: string;
  fullName: string;
  role: UserRole;
  verificationToken: string;
}

export async function createUser(input: CreateUserInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, username, full_name, role, verification_token)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.email,
      input.passwordHash,
      input.username,
      input.fullName,
      input.role,
      input.verificationToken,
    ],
  );
  return result.insertId;
}

/** Marks the user verified and clears the one-time verification token. */
export async function markVerified(userId: number): Promise<void> {
  await pool.query(
    'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
    [userId],
  );
}

/** Admin action: suspend or reinstate a user. */
export async function setSuspended(
  userId: number,
  suspended: boolean,
  reason: string | null = null,
): Promise<void> {
  await pool.query('UPDATE users SET is_suspended = ?, suspended_reason = ? WHERE id = ?', [
    suspended,
    suspended ? reason : null,
    userId,
  ]);
}

export interface UpdateProfileInput {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

export async function updateProfile(userId: number, input: UpdateProfileInput): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (input.username !== undefined) {
    fields.push('username = ?');
    values.push(input.username);
  }
  if (input.fullName !== undefined) {
    fields.push('full_name = ?');
    values.push(input.fullName);
  }
  if (input.avatarUrl !== undefined) {
    fields.push('avatar_url = ?');
    values.push(input.avatarUrl);
  }
  if (fields.length === 0) return;
  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
}
