import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { AuctionSummary } from '../../types/auction';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveImageUrl } from '../../utils/media';
import StateBadge from './StateBadge';

export default function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const thumb = resolveImageUrl(auction.thumbnailUrl);
  const price = auction.currentBid > 0 ? auction.currentBid : auction.startingPrice;
  const priceLabel = auction.currentBid > 0 ? 'Current bid' : 'Starting price';
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Subtle pointer-driven 3D tilt. Skipped automatically on coarse pointers /
  // reduced-motion via the CSS transition being near-instant there.
  const onMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-4px)`;
  };
  const reset = () => {
    const el = cardRef.current;
    if (el) el.style.transform = '';
  };

  return (
    <Link
      ref={cardRef}
      to={`/auctions/${auction.id}`}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:border-brand-300 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {thumb ? (
          <img
            src={thumb}
            alt={auction.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-brand-radial text-slate-400">
            No image
          </div>
        )}
        {/* Gradient scrim for badge legibility */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="absolute left-2.5 top-2.5">
          <StateBadge state={auction.state} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-500">
          {auction.categoryName}
        </span>
        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900 dark:text-slate-100">
          {auction.title}
        </h3>
        <div className="mt-auto pt-3">
          <p className="text-xs text-slate-500">{priceLabel}</p>
          <p className="text-xl font-bold tabular-nums">
            <span className="gradient-text">{formatCurrency(price)}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'} · @{auction.seller.username}
          </p>
        </div>
      </div>
    </Link>
  );
}
