import type { AuctionSummary } from '../../types/auction';
import AuctionCard from './AuctionCard';

export default function AuctionGrid({ auctions }: { auctions: AuctionSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {auctions.map((a) => (
        <AuctionCard key={a.id} auction={a} />
      ))}
    </div>
  );
}
