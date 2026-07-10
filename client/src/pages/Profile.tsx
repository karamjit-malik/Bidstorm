import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';

/** Minimal protected page — proves the auth guard + token-authenticated state. */
export default function Profile() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const rows: [string, string][] = [
    ['Full name', user.fullName],
    ['Username', user.username],
    ['Email', user.email],
    ['Role', user.role],
    ['Verified', user.isVerified ? 'Yes' : 'No'],
    ['Reputation', String(user.reputationScore)],
  ];

  return (
    <div className="min-h-screen bg-[#efedea] text-black">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Your profile</h1>
        <dl className="mt-6 divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 bg-white">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between px-5 py-3.5 text-sm">
              <dt className="text-black/50">{k}</dt>
              <dd className="font-medium capitalize text-black">{v}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
