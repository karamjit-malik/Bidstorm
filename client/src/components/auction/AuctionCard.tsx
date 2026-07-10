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
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {thumb ? (
          <img
            src={thumb}
            alt={auction.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">No image</div>
        )}
        <div className="absolute left-2 top-2">
          <StateBadge state={auction.state} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
          {auction.categoryName}
        </span>
        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900 dark:text-slate-100">
          {auction.title}
        </h3>
        <div className="mt-auto pt-3">
          <p className="text-xs text-slate-500">{priceLabel}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(price)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'} · @{auction.seller.username}
          </p>
        </div>
      </div>
    </Link>
  );
}
