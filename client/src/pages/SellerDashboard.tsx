import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import StateBadge from '../components/auction/StateBadge';
import * as auctionService from '../services/auctionService';
import type { AuctionState, AuctionSummary } from '../types/auction';
import { formatCurrency } from '../utils/formatCurrency';
import { resolveImageUrl } from '../utils/media';

// Display order for the grouped sections.
const GROUP_ORDER: AuctionState[] = [
  'DRAFT',
  'SCHEDULED',
  'LIVE',
  'EXTENDING',
  'ENDED',
  'SETTLING',
  'COMPLETED',
];

export default function SellerDashboard() {
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    auctionService
      .listMyAuctions()
      .then(setAuctions)
      .catch(() => setError('Failed to load your auctions'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onDelete = async (id: number) => {
    if (!confirm('Delete this draft auction? This cannot be undone.')) return;
    try {
      await auctionService.deleteAuction(id);
      setAuctions((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Only DRAFT auctions can be deleted');
    }
  };

  const grouped = GROUP_ORDER.map((state) => ({
    state,
    items: auctions.filter((a) => a.state === state),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My auctions</h1>
          <Link
            to="/auctions/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New auction
          </Link>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <p className="mt-8 text-slate-500">Loading…</p>
        ) : auctions.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-700">
            You haven't created any auctions yet.
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {grouped.map((group) => (
              <section key={group.state}>
                <div className="mb-3 flex items-center gap-2">
                  <StateBadge state={group.state} />
                  <span className="text-sm text-slate-500">({group.items.length})</span>
                </div>
                <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                  {group.items.map((a) => (
                    <div key={a.id} className="flex items-center gap-4 p-4">
                      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {a.thumbnailUrl ? (
                          <img
                            src={resolveImageUrl(a.thumbnailUrl) ?? ''}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.title}</p>
                        <p className="text-xs text-slate-500">
                          {a.categoryName} · {a.bidCount} bids ·{' '}
                          {formatCurrency(a.currentBid > 0 ? a.currentBid : a.startingPrice)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2 text-sm">
                        <Link
                          to={`/auctions/${a.id}`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          View
                        </Link>
                        {a.state === 'DRAFT' && (
                          <button
                            onClick={() => void onDelete(a.id)}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
