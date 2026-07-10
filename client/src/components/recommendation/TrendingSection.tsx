import { useEffect, useState } from 'react';
import AuctionCarousel from './AuctionCarousel';
import * as recommendationService from '../../services/recommendationService';
import type { AuctionSummary } from '../../types/auction';

/** "Trending Now" — public, time-decayed bid activity. */
export default function TrendingSection() {
  const [items, setItems] = useState<AuctionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationService
      .getTrending()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuctionCarousel
      title="Trending now 🔥"
      subtitle="Auctions heating up right now"
      items={items}
      loading={loading}
      emptyText="No trending auctions yet — check back once bidding picks up."
    />
  );
}
