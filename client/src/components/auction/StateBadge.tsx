import type { AuctionState } from '../../types/auction';

// A small dot colour per state; the pill itself stays monochrome/editorial.
const DOT: Record<AuctionState, string> = {
  DRAFT: 'bg-black/30',
  SCHEDULED: 'bg-blue-500',
  LIVE: 'bg-green-500',
  EXTENDING: 'bg-amber-500',
  ENDED: 'bg-black/30',
  SETTLING: 'bg-purple-500',
  COMPLETED: 'bg-green-600',
};

export default function StateBadge({ state }: { state: AuctionState }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-black backdrop-blur">
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT[state]} ${state === 'LIVE' ? 'animate-pulse' : ''}`}
      />
      {state}
    </span>
  );
}
