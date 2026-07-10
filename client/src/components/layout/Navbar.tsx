import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/** Shared top navigation used across the app's content pages. */
export default function Navbar() {
  const { user, isAuthenticated, status, logout } = useAuth();
  const canSell = user?.role === 'seller' || user?.role === 'admin';

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-brand-600">
            BidStorm ⚡
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            <Link to="/auctions" className="text-slate-600 hover:text-brand-600 dark:text-slate-300">
              Browse
            </Link>
            {canSell && (
              <Link
                to="/dashboard"
                className="text-slate-600 hover:text-brand-600 dark:text-slate-300"
              >
                My auctions
              </Link>
            )}
          </nav>
        </div>

        <nav className="flex items-center gap-3 text-sm">
          {status === 'loading' ? (
            <span className="text-slate-400">…</span>
          ) : isAuthenticated && user ? (
            <>
              {canSell && (
                <Link
                  to="/auctions/new"
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
                >
                  + New auction
                </Link>
              )}
              <Link
                to="/profile"
                className="text-slate-600 hover:text-brand-600 dark:text-slate-300"
              >
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
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
