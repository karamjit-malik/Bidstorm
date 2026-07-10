/**
 * Trending score with exponential time decay on recency of the last bid:
 *   score = bid_count · e^(-0.1 · hours_since_last_bid)
 * An auction with no bids scores 0; fresher activity ranks higher.
 */
export function timeDecayScore(bidCount: number, lastBidAt: Date | null): number {
  if (bidCount <= 0 || !lastBidAt) return 0;
  const hoursSince = (Date.now() - lastBidAt.getTime()) / (1000 * 60 * 60);
  return bidCount * Math.exp(-0.1 * Math.max(0, hoursSince));
}
