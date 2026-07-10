import { Link } from 'react-router-dom';
import type { AuctionSummary } from '../../types/auction';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveImageUrl } from '../../utils/media';
import StateBadge from './StateBadge';

export default function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const thumb = resolveImageUrl(auction.thumbnailUrl);
  const price = auction.currentBid > 0 ? auction.currentBid : auction.startingPrice;
  const priceLabel = auction.currentBid > 0 ? 'Current bid' : 'Starting price';

  return (
    <Link
      to={`/auctions/${auction.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-black/25 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e7e4de]">
        {thumb ? (
          <img
            src={thumb}
            alt={auction.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-black/40">No image</div>
        )}
        <div className="absolute left-2.5 top-2.5">
          <StateBadge state={auction.state} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-medium uppercase tracking-widest text-black/50">
          {auction.categoryName}
        </span>
        <h3 className="mt-1.5 line-clamp-2 font-display text-[17px] leading-snug text-black">
          {auction.title}
        </h3>
        <div className="mt-auto pt-4">
          <p className="text-[11px] uppercase tracking-wide text-black/45">{priceLabel}</p>
          <p className="text-[22px] font-medium tabular-nums text-black">{formatCurrency(price)}</p>
          <p className="mt-1 text-[12px] text-black/50">
            {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'} · @{auction.seller.username}
          </p>
        </div>
      </div>
    </Link>
  );
}
