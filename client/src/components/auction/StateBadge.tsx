import type { AuctionState } from '../../types/auction';

const STYLES: Record<AuctionState, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  LIVE: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  EXTENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ENDED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SETTLING: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export default function StateBadge({ state }: { state: AuctionState }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[state]}`}
    >
      {state === 'LIVE' && <span className="mr-1 animate-pulse">●</span>}
      {state}
    </span>
  );
}
