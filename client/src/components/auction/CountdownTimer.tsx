import { useCountdown } from '../../hooks/useCountdown';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Server-synced countdown. Flashes urgent styling in the final 60s and shows
 * "Ended" when time runs out.
 */
export default function CountdownTimer({
  endTime,
  offsetMs = 0,
}: {
  endTime: string | null;
  offsetMs?: number;
}) {
  const c = useCountdown(endTime, offsetMs);

  if (c.ended) {
    return <span className="font-mono text-lg font-semibold text-slate-500">Ended</span>;
  }

  const urgent = c.total <= 60_000;
  return (
    <span
      className={`font-mono text-lg font-semibold tabular-nums ${
        urgent ? 'animate-pulse text-red-600' : 'text-slate-900 dark:text-slate-100'
      }`}
    >
      {c.days > 0 && `${c.days}d `}
      {pad(c.hours)}:{pad(c.minutes)}:{pad(c.seconds)}
    </span>
  );
}
