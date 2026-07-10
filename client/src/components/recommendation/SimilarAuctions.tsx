import { useEffect, useState } from 'react';
import AuctionCarousel from './AuctionCarousel';
import * as recommendationService from '../../services/recommendationService';
import type { AuctionSummary } from '../../types/auction';

/** "Similar Auctions" on the detail page — hidden entirely when there are none. */
export default function SimilarAuctions({ auctionId }: { auctionId: number }) {
  const [items, setItems] = useState<AuctionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    recommendationService
      .getSimilar(auctionId)
      .then((res) => active && setItems(res))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [auctionId]);

  return (
    <AuctionCarousel
      title="Similar auctions"
      items={items}
      loading={loading}
      hideWhenEmpty
    />
  );
}
