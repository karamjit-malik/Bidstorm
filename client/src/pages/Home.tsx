import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RecommendedCarousel from '../components/recommendation/RecommendedCarousel';
import TrendingSection from '../components/recommendation/TrendingSection';

export default function Home() {
  const { user, isAuthenticated, status, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold text-brand-600">
            BidStorm ⚡
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {status === 'loading' ? (
              <span className="text-slate-400">…</span>
            ) : isAuthenticated && user ? (
              <>
                <Link to="/profile" className="text-slate-600 hover:text-brand-600 dark:text-slate-300">
                  {user.username}
                </Link>
                <button
                  onClick={() => void logout()}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-brand-600 dark:text-slate-300">
                  Log in
                </Link>
                <Link to="/register" className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Real-time auctions, intelligently matched.</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Bid live with sub-second updates and discover items picked just for you.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/auctions"
            className="inline-block rounded-lg bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700"
          >
            Browse auctions
          </Link>
          {isAuthenticated && user ? (
            <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
              Signed in as <span className="font-semibold">{user.fullName}</span> ·{' '}
              <span className="capitalize text-brand-600">{user.role}</span>
            </p>
          ) : (
            <Link
              to="/register"
              className="inline-block rounded-lg border border-slate-300 px-5 py-3 font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Get started
            </Link>
          )}
        </div>

        <RecommendedCarousel />
        <TrendingSection />
      </main>
    </div>
  );
}
