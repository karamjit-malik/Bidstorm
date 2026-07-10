import { computeTrending } from '../services/recommendationService';

/**
 * Recomputes trending scores (time-decayed bid activity) and refreshes the
 * in-memory trending cache that /recommendations/trending serves from.
 */
export async function runTrendingCompute(): Promise<number> {
  const items = await computeTrending();
  console.log(`[jobs] trending recomputed: ${items.length} auctions`);
  return items.length;
}
