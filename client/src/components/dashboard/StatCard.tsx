interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'warning';
}

/** Headline metric tile (a "hero number", per the dataviz form heuristic). */
export default function StatCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === 'warning'
          ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
