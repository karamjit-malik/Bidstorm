import type { Bid } from '../../types/bid';
import { formatCurrency } from '../../utils/formatCurrency';

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

/** Live-updating list of recent bids, most recent first. */
export default function BidFeed({ bids }: { bids: Bid[] }) {
  if (bids.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
        No bids yet — be the first!
      </p>
    );
  }

  return (
    <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
      {bids.map((b, i) => (
        <li
          key={b.id}
          className={`flex items-center justify-between py-2.5 text-sm ${
            b.isRetracted ? 'opacity-40' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              @{b.bidderUsername}
            </span>
            {i === 0 && !b.isRetracted && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                High bid
              </span>
            )}
            {b.isRetracted && <span className="text-xs italic text-slate-400">retracted</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-semibold ${b.isRetracted ? 'line-through' : ''}`}>
              {formatCurrency(b.amount)}
            </span>
            <span className="w-16 text-right text-xs text-slate-400">{timeAgo(b.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
