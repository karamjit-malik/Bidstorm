import * as auctionModel from '../models/auctionModel';
import * as interactionModel from '../models/interactionModel';
import * as similarityModel from '../models/similarityModel';
import * as preferenceModel from '../models/preferenceModel';
import * as bidModel from '../models/bidModel';
import { timeDecayScore } from '../utils/timeDecayScore';
import { toSummaries } from './auctionService';
import type { AuctionRow, PublicAuctionSummary } from '../models/auctionModel';

/** Users with fewer than this many interactions get content-based cold start. */
const COLD_START_THRESHOLD = 5;
const DEFAULT_COUNT = 20;
const URGENCY_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h — "ending soon" boost

export interface RecommendationItem extends PublicAuctionSummary {
  reason: 'cold_start' | 'collaborative' | 'trending';
}

/**
 * Hybrid "For You" recommendations. Fewer than 5 interactions → content-based
 * cold start from category preferences; otherwise collaborative filtering off
 * the nightly similarity cache. Falls back to trending when neither yields
 * enough (e.g. brand-new account with no preferences, or empty cache).
 */
export async function getForYou(userId: number, count = DEFAULT_COUNT): Promise<RecommendationItem[]> {
  const interactionCount = await interactionModel.countByUser(userId);

  const items =
    interactionCount < COLD_START_THRESHOLD
      ? await coldStart(userId, count)
      : await collaborative(userId, count);

  if (items.length >= count) return items;

  // Backfill with trending so the carousel is never awkwardly empty — but never
  // resurface auctions the user already saw in this list or has interacted with.
  const interacted = new Set((await interactionModel.weightsByUser(userId)).keys());
  const have = new Set(items.map((i) => i.id));
  const filler: RecommendationItem[] = (await getTrending(count))
    .filter((t) => !have.has(t.id) && !interacted.has(t.id))
    .slice(0, count - items.length)
    .map((t) => ({ ...t, reason: 'trending' }));
  return [...items, ...filler];
}

async function coldStart(userId: number, count: number): Promise<RecommendationItem[]> {
  const categoryIds = await preferenceModel.getPreferredCategoryIds(userId);
  const interacted = Array.from((await interactionModel.weightsByUser(userId)).keys());

  const rows = await auctionModel.findColdStartCandidates({
    categoryIds, // empty → any category
    excludeAuctionIds: interacted,
    excludeSellerId: userId,
    limit: count * 2,
  });

  // Boost auctions ending within the urgency window, keep soonest-ending first.
  const ranked = rankColdStart(rows).slice(0, count);
  const summaries = await toSummaries(ranked);
  return summaries.map((s) => ({ ...s, reason: 'cold_start' }));
}

function rankColdStart(rows: AuctionRow[]): AuctionRow[] {
  const now = Date.now();
  return [...rows].sort((a, b) => {
    const aUrgent = new Date(a.end_time).getTime() - now <= URGENCY_WINDOW_MS ? 1 : 0;
    const bUrgent = new Date(b.end_time).getTime() - now <= URGENCY_WINDOW_MS ? 1 : 0;
    if (aUrgent !== bUrgent) return bUrgent - aUrgent; // urgent first
    return new Date(a.end_time).getTime() - new Date(b.end_time).getTime(); // soonest end
  });
}

async function collaborative(userId: number, count: number): Promise<RecommendationItem[]> {
  const sourceWeights = await interactionModel.weightsByUser(userId);
  const interactedIds = new Set(sourceWeights.keys());

  // Accumulate score for each candidate = Σ similarity(source, candidate) * sourceWeight.
  const scores = new Map<number, number>();
  for (const [sourceId, weight] of sourceWeights) {
    const similar = await similarityModel.topSimilar(sourceId, 20);
    for (const s of similar) {
      const candidate = Number(s.auction_id_b);
      if (interactedIds.has(candidate)) continue; // already engaged
      const contribution = Number(s.similarity_score) * weight;
      scores.set(candidate, (scores.get(candidate) ?? 0) + contribution);
    }
  }

  if (scores.size === 0) return [];

  const rankedIds = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const rows = await auctionModel.findByIds(rankedIds);

  // Keep only live, non-owned auctions; preserve the score ranking.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const eligible: AuctionRow[] = [];
  for (const id of rankedIds) {
    const row = byId.get(id);
    if (!row) continue;
    if (row.seller_id === userId) continue;
    if (row.state !== 'LIVE' && row.state !== 'EXTENDING') continue;
    eligible.push(row);
    if (eligible.length >= count) break;
  }

  const summaries = await toSummaries(eligible);
  return summaries.map((s) => ({ ...s, reason: 'collaborative' }));
}

/**
 * Trending auctions by time-decay score. Served from the in-memory cache the
 * 15-min job refreshes; computes live on a cold cache.
 */
export async function getTrending(count = DEFAULT_COUNT): Promise<PublicAuctionSummary[]> {
  const cached = getTrendingCache();
  if (cached) return cached.slice(0, count);
  const fresh = await computeTrending(count);
  return fresh;
}

/** Recomputes trending scores over active auctions and returns top summaries. */
export async function computeTrending(count = DEFAULT_COUNT): Promise<PublicAuctionSummary[]> {
  const rows = await auctionModel.findActiveWithBids(200);
  if (rows.length === 0) {
    setTrendingCache([]);
    return [];
  }
  const lastBids = await bidModel.lastBidTimes(rows.map((r) => r.id));
  const scored = rows
    .map((r) => ({ row: r, score: timeDecayScore(r.bid_count, lastBids.get(r.id) ?? null) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(count, DEFAULT_COUNT));

  const summaries = await toSummaries(scored.map((x) => x.row));
  setTrendingCache(summaries);
  return summaries.slice(0, count);
}

export async function getSimilar(auctionId: number, count = 12): Promise<PublicAuctionSummary[]> {
  const similar = await similarityModel.topSimilar(auctionId, count * 2);
  if (similar.length === 0) return [];

  const ids = similar.map((s) => Number(s.auction_id_b));
  const rows = await auctionModel.findByIds(ids);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const eligible: AuctionRow[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) continue;
    if (row.state !== 'LIVE' && row.state !== 'EXTENDING') continue; // don't suggest ended items
    eligible.push(row);
    if (eligible.length >= count) break;
  }
  return toSummaries(eligible);
}

// --- In-memory trending cache (refreshed by trendingComputeJob) ---
let trendingCache: PublicAuctionSummary[] | null = null;
let trendingCachedAt = 0;
const TRENDING_TTL_MS = 20 * 60 * 1000; // safety TTL if the job stalls

function getTrendingCache(): PublicAuctionSummary[] | null {
  if (trendingCache && Date.now() - trendingCachedAt < TRENDING_TTL_MS) return trendingCache;
  return null;
}

function setTrendingCache(items: PublicAuctionSummary[]): void {
  trendingCache = items;
  trendingCachedAt = Date.now();
}
