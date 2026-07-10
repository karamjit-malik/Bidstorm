import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import Navbar from '../components/layout/Navbar';
import AuctionGrid from '../components/auction/AuctionGrid';
import * as auctionService from '../services/auctionService';
import * as categoryService from '../services/categoryService';
import type { AuctionState, AuctionSummary, Category } from '../types/auction';
import { inputCls } from './Login';

const STATE_OPTIONS: { label: string; value: AuctionState | '' }[] = [
  { label: 'All statuses', value: '' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Ended', value: 'ENDED' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function AuctionList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<AuctionSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter inputs
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [state, setState] = useState<AuctionState | ''>('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    void categoryService.listCategories().then(setCategories).catch(() => undefined);
  }, []);

  // Debounce the free-text search so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const buildFilters = useCallback(
    (cursor?: number) => ({
      cursor,
      search: debouncedSearch || undefined,
      categoryId: categoryId === '' ? undefined : categoryId,
      state: state === '' ? undefined : state,
      priceMin: priceMin === '' ? undefined : Number(priceMin),
      priceMax: priceMax === '' ? undefined : Number(priceMax),
    }),
    [debouncedSearch, categoryId, state, priceMin, priceMax],
  );

  // Guards against out-of-order responses when filters change quickly.
  const reqId = useRef(0);

  const runSearch = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await auctionService.listAuctions(buildFilters());
      if (id !== reqId.current) return;
      setItems(res.items);
      setNextCursor(res.nextCursor);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err instanceof AxiosError ? (err.response?.data?.error ?? 'Failed to load') : 'Failed to load');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [buildFilters]);

  // Re-run whenever any committed filter changes.
  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const loadMore = async () => {
    if (nextCursor == null) return;
    setLoading(true);
    try {
      const res = await auctionService.listAuctions(buildFilters(nextCursor));
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch {
      setError('Failed to load more');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Browse auctions</h1>

        {/* Filter bar */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className={inputCls}
            placeholder="Search title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={inputCls}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={inputCls}
            value={state}
            onChange={(e) => setState(e.target.value as AuctionState | '')}
          >
            {STATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            type="number"
            min="0"
            placeholder="Min price"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <input
            className={inputCls}
            type="number"
            min="0"
            placeholder="Max price"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>

        {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

        <div className="mt-8">
          {items.length === 0 && !loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-700">
              No auctions match your filters yet.
            </div>
          ) : (
            <AuctionGrid auctions={items} />
          )}
        </div>

        {loading && <p className="mt-6 text-center text-sm text-slate-500">Loading…</p>}

        {nextCursor != null && !loading && (
          <div className="mt-8 text-center">
            <button
              onClick={() => void loadMore()}
              className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Load more
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
