import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import StatCard from '../components/dashboard/StatCard';
import { CountBarChart } from '../components/dashboard/AnalyticsCharts';
import { useAuth } from '../hooks/useAuth';
import { useNotificationStore } from '../store/notificationStore';
import * as adminService from '../services/adminService';
import type { FraudSignal, PlatformOverview } from '../services/adminService';
import { formatCurrency } from '../utils/formatCurrency';

const SIGNAL_LABELS: Record<string, string> = {
  same_ip: 'Same IP',
  min_increment_pattern: 'Min-increment shill',
  bid_retract_pattern: 'Retract pattern',
  new_account_high_value: 'New account, high value',
  velocity_spike: 'Velocity spike',
};

function riskTone(score: number): string {
  if (score >= 0.75) return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
  if (score >= 0.5) return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

export default function AdminDashboard() {
  const { user, status } = useAuth();
  const push = useNotificationStore((s) => s.push);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([adminService.getOverview(), adminService.getFraudSignals(false)])
      .then(([o, s]) => {
        setOverview(o);
        setSignals(s);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'authenticated' && user?.role === 'admin') load();
  }, [status, user?.role]);

  // Gate to admins only.
  if (status !== 'loading' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const resolve = async (id: number) => {
    try {
      await adminService.resolveFraudSignal(id);
      setSignals((prev) => prev.filter((s) => s.id !== id));
      push({ tone: 'success', title: 'Signal resolved' });
    } catch {
      push({ tone: 'error', title: 'Could not resolve signal' });
    }
  };

  const suspendAuction = async (auctionId: number) => {
    if (!confirm(`Suspend auction #${auctionId}? This stops it immediately.`)) return;
    try {
      await adminService.suspendAuction(auctionId);
      push({ tone: 'success', title: `Auction #${auctionId} suspended` });
      load();
    } catch {
      push({ tone: 'error', title: 'Could not suspend auction' });
    }
  };

  const suspendUser = async (userId: number | null) => {
    if (!userId) return;
    if (!confirm(`Suspend user #${userId}? They will be logged out and blocked.`)) return;
    try {
      await adminService.suspendUser(userId);
      push({ tone: 'success', title: `User #${userId} suspended` });
    } catch {
      push({ tone: 'error', title: 'Could not suspend user' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>

        {loading ? (
          <p className="mt-8 text-slate-500">Loading…</p>
        ) : (
          <>
            {overview && (
              <>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard label="Users" value={overview.totals.users} />
                  <StatCard label="Auctions" value={overview.totals.auctions} />
                  <StatCard label="Bids" value={overview.totals.bids} />
                  <StatCard label="GMV" value={formatCurrency(overview.totals.grossMerchandiseValue)} />
                  <StatCard label="Active" value={overview.totals.activeAuctions} />
                  <StatCard
                    label="Open signals"
                    value={overview.totals.openFraudSignals}
                    tone={overview.totals.openFraudSignals > 0 ? 'warning' : 'default'}
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <CountBarChart
                    title="Auctions by state"
                    data={overview.auctionsByState.map((s) => ({ label: s.state, count: s.count }))}
                  />
                  <CountBarChart
                    title="Top categories"
                    data={overview.topCategories.map((c) => ({ label: c.category, count: c.count }))}
                  />
                </div>
              </>
            )}

            <h2 className="mt-10 text-lg font-semibold">
              Fraud signals{' '}
              <span className="text-sm font-normal text-slate-500">({signals.length} open)</span>
            </h2>
            {signals.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700">
                No open fraud signals. 🎉
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3">Risk</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Auction</th>
                      <th className="px-4 py-3">Detail</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {signals.map((s) => (
                      <tr key={s.id} className="align-top">
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${riskTone(s.riskScore)}`}
                          >
                            {s.riskScore.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {SIGNAL_LABELS[s.signalType] ?? s.signalType}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-500">#{s.auctionId}</span>{' '}
                          {s.auctionTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {s.description}
                          {s.flaggedUsername && (
                            <span className="mt-0.5 block text-xs text-slate-400">
                              flagged: @{s.flaggedUsername}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => void resolve(s.id)}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => void suspendAuction(s.auctionId)}
                              className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950"
                            >
                              Suspend auction
                            </button>
                            {s.flaggedUserId && (
                              <button
                                onClick={() => void suspendUser(s.flaggedUserId)}
                                className="rounded-lg border border-red-300 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                              >
                                Suspend user
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
