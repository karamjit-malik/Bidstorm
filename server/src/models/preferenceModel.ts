import type { RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

export interface PreferenceRow extends RowDataPacket {
  category_id: number;
  preference_score: number;
}

/** Replaces a user's category preferences (onboarding). */
export async function setPreferences(
  userId: number,
  categoryIds: number[],
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM user_category_preferences WHERE user_id = ?', [userId]);
    if (categoryIds.length > 0) {
      const values = categoryIds.map((cid) => [userId, cid, 1.0]);
      await conn.query(
        'INSERT INTO user_category_preferences (user_id, category_id, preference_score) VALUES ?',
        [values],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getPreferences(userId: number): Promise<PreferenceRow[]> {
  const [rows] = await pool.query<PreferenceRow[]>(
    'SELECT category_id, preference_score FROM user_category_preferences WHERE user_id = ? ORDER BY preference_score DESC',
    [userId],
  );
  return rows;
}

export async function getPreferredCategoryIds(userId: number): Promise<number[]> {
  const rows = await getPreferences(userId);
  return rows.map((r) => Number(r.category_id));
}
