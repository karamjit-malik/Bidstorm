import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/** Minimal protected page — proves the auth guard + token-authenticated state. */
export default function Profile() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-brand-600 hover:underline">
          ← Back home
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">Your profile</h1>
        <dl className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {[
            ['Full name', user.fullName],
            ['Username', user.username],
            ['Email', user.email],
            ['Role', user.role],
            ['Verified', user.isVerified ? 'Yes' : 'No'],
            ['Reputation', String(user.reputationScore)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-3 text-sm">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium capitalize text-slate-900 dark:text-slate-100">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
