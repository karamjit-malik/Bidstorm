import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import StateBadge from '../components/auction/StateBadge';
import * as auctionService from '../services/auctionService';
import type { AuctionDetail as AuctionDetailT } from '../types/auction';
import { formatCurrency } from '../utils/formatCurrency';
import { resolveImageUrl } from '../utils/media';

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<AuctionDetailT | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auctionId = Number(id);
    if (!Number.isFinite(auctionId)) {
      setError('Invalid auction');
      setLoading(false);
      return;
    }
    setLoading(true);
    auctionService
      .getAuction(auctionId)
      .then((a) => {
        setAuction(a);
        setActiveImage(0);
      })
      .catch(() => setError('Auction not found'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : error || !auction ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-700">
            {error ?? 'Auction not found'}
            <div className="mt-4">
              <Link to="/auctions" className="text-brand-600 hover:underline">
                ← Back to browse
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {auction.images.length > 0 ? (
                  <img
                    src={resolveImageUrl(auction.images[activeImage]?.imageUrl) ?? ''}
                    alt={auction.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-slate-400">
                    No image
                  </div>
                )}
              </div>
              {auction.images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {auction.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                        i === activeImage ? 'border-brand-600' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={resolveImageUrl(img.thumbnailUrl) ?? ''}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-3">
                <StateBadge state={auction.state} />
                <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {auction.categoryName}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-bold">{auction.title}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Sold by @{auction.seller.username} · reputation{' '}
                {auction.seller.reputationScore.toFixed(2)}
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">
                  {auction.currentBid > 0 ? 'Current bid' : 'Starting price'}
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(auction.currentBid > 0 ? auction.currentBid : auction.startingPrice)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'} · min increment{' '}
                  {formatCurrency(auction.minBidIncrement)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Starts</p>
                    <p className="font-medium">{new Date(auction.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Ends</p>
                    <p className="font-medium">{new Date(auction.endTime).toLocaleString()}</p>
                  </div>
                </div>
                {/* Live bidding controls arrive in Phase 4. */}
                <p className="mt-4 text-xs italic text-slate-400">
                  Live bidding opens in the next phase.
                </p>
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {auction.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
