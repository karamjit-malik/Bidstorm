import { useEffect, useState } from 'react';

type Health = { status: string; service: string } | null;

export default function App() {
  const [health, setHealth] = useState<Health>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((json) => setHealth(json.data))
      .catch(() => setError('API unreachable — is the server running on :5000?'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-2xl font-bold text-brand-600">BidStorm ⚡</h1>
          <p className="text-sm text-slate-500">Real-time auctions with intelligent recommendations</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-lg font-semibold">Phase 1 — Scaffolding online</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          The monorepo, database schema, and dev servers are wired up.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="font-medium">Backend health:</span>
          {error ? (
            <span className="text-red-500">{error}</span>
          ) : health ? (
            <span className="text-green-600">{health.status} · {health.service}</span>
          ) : (
            <span className="text-slate-400">checking…</span>
          )}
        </div>
      </main>
    </div>
  );
}
