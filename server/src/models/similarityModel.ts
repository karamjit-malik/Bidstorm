import type { RowDataPacket } from 'mysql2/promise';
import { pool } from './db';

export interface SimilarPair {
  auctionIdA: number;
  auctionIdB: number;
  score: number;
}

/**
 * Replaces the entire similarity cache in one transaction. The nightly job
 * recomputes all pairs, so a clean swap keeps reads consistent and drops stale
 * entries for auctions that ended.
 */
export async function replaceAll(pairs: SimilarPair[]): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM item_similarity_cache');
    // Batch insert in chunks to keep the statement size reasonable.
    const CHUNK = 500;
    for (let i = 0; i < pairs.length; i += CHUNK) {
      const slice = pairs.slice(i, i + CHUNK);
      if (slice.length === 0) continue;
      const values = slice.map((p) => [p.auctionIdA, p.auctionIdB, p.score]);
      await conn.query(
        'INSERT INTO item_similarity_cache (auction_id_a, auction_id_b, similarity_score) VALUES ?',
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

export interface SimilarEntry extends RowDataPacket {
  auction_id_b: number;
  similarity_score: number;
}

/** Top similar auction ids for a source auction, highest score first. */
export async function topSimilar(auctionId: number, limit = 20): Promise<SimilarEntry[]> {
  const [rows] = await pool.query<SimilarEntry[]>(
    `SELECT auction_id_b, similarity_score FROM item_similarity_cache
     WHERE auction_id_a = ? ORDER BY similarity_score DESC LIMIT ?`,
    [auctionId, limit],
  );
  return rows;
}

export async function count(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM item_similarity_cache',
  );
  return Number(rows[0]?.n ?? 0);
}
