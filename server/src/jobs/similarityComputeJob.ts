import * as interactionModel from '../models/interactionModel';
import * as similarityModel from '../models/similarityModel';
import { cosineSimilarity } from '../utils/cosineSimilarity';

const TOP_N = 20; // store the top 20 similar items per auction

/**
 * Nightly item-item collaborative filtering. Builds a per-auction interaction
 * vector (users → strongest weight), then for each auction computes cosine
 * similarity against auctions sharing at least one user (inverted-index
 * candidate generation, avoiding a full O(n²) scan) and caches the top 20.
 * Returns the number of similarity pairs written.
 */
export async function runSimilarityCompute(): Promise<number> {
  const interactions = await interactionModel.allAggregated();

  // auctionId -> (userId -> weight), and userId -> [auctionIds] inverted index.
  const vectors = new Map<number, Map<number, number>>();
  const userAuctions = new Map<number, number[]>();
  for (const { userId, auctionId, weight } of interactions) {
    let vec = vectors.get(auctionId);
    if (!vec) vectors.set(auctionId, (vec = new Map()));
    vec.set(userId, weight);
    const list = userAuctions.get(userId);
    if (list) list.push(auctionId);
    else userAuctions.set(userId, [auctionId]);
  }

  const pairs: similarityModel.SimilarPair[] = [];
  for (const [auctionId, vec] of vectors) {
    const candidates = new Set<number>();
    for (const userId of vec.keys()) {
      for (const other of userAuctions.get(userId) ?? []) {
        if (other !== auctionId) candidates.add(other);
      }
    }

    const scored: { id: number; sim: number }[] = [];
    for (const candidate of candidates) {
      const sim = cosineSimilarity(vec, vectors.get(candidate)!);
      if (sim > 0) scored.push({ id: candidate, sim });
    }
    scored.sort((a, b) => b.sim - a.sim);

    for (const s of scored.slice(0, TOP_N)) {
      pairs.push({
        auctionIdA: auctionId,
        auctionIdB: s.id,
        score: Math.round(Math.min(s.sim, 1) * 10000) / 10000, // DECIMAL(5,4)
      });
    }
  }

  await similarityModel.replaceAll(pairs);
  console.log(`[jobs] similarity computed: ${pairs.length} pairs across ${vectors.size} auctions`);
  return pairs.length;
}
