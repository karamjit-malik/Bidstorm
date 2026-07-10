import type { ReactNode } from 'react';
import type { AuctionSummary } from '../../types/auction';
import AuctionCard from '../auction/AuctionCard';

interface Props {
  title: string;
  subtitle?: string;
  items: AuctionSummary[];
  loading?: boolean;
  emptyText?: string;
  /** Hide the whole section when there's nothing to show (used for "similar"). */
  hideWhenEmpty?: boolean;
  action?: ReactNode;
}

/**
 * Horizontal, scroll-snapping row of auction cards. Used for the "Recommended",
 * "Trending", and "Similar" sections so they read as one system.
 */
export default function AuctionCarousel({
  title,
  subtitle,
  items,
  loading,
  emptyText = 'Nothing to show yet.',
  hideWhenEmpty,
  action,
}: Props) {
  if (hideWhenEmpty && !loading && items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 w-64 shrink-0 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          {emptyText}
        </div>
      ) : (
        <div className="flex snap-x gap-4 overflow-x-auto pb-2">
          {items.map((a) => (
            <div key={a.id} className="w-64 shrink-0 snap-start">
              <AuctionCard auction={a} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
