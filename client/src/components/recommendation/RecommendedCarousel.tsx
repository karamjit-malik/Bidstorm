import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuctionCarousel from './AuctionCarousel';
import * as recommendationService from '../../services/recommendationService';
import type { AuctionSummary } from '../../types/auction';

/** "Recommended For You" — personalized, signed-in users only. */
export default function RecommendedCarousel() {
  const { isAuthenticated, status } = useAuth();
  const [items, setItems] = useState<AuctionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    recommendationService
      .getForYou()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, status]);

  if (!isAuthenticated) return null;

  return (
    <AuctionCarousel
      title="Recommended for you"
      subtitle="Picked from your activity and interests"
      items={items}
      loading={loading}
      emptyText="Browse and bid on a few auctions and we'll tailor picks for you."
    />
  );
}
