import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from './db';
import type { NotificationType } from '../types';

export interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  reference_id: number | null;
  reference_type: string | null;
  is_read: number;
  created_at: Date;
}

export interface PublicNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function toPublicNotification(row: NotificationRow): PublicNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    referenceId: row.reference_id,
    referenceType: row.reference_type,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: number | null;
  referenceType?: string | null;
}

export async function createNotification(
  input: CreateNotificationInput,
  conn: PoolConnection | typeof pool = pool,
): Promise<number> {
  const [result] = await conn.query<ResultSetHeader>(
    `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.type,
      input.title,
      input.message,
      input.referenceId ?? null,
      input.referenceType ?? null,
    ],
  );
  return result.insertId;
}

export async function findByUser(userId: number, limit = 30): Promise<NotificationRow[]> {
  const [rows] = await pool.query<NotificationRow[]>(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit],
  );
  return rows;
}
