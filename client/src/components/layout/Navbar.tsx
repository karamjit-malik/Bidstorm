import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/** Shared top navigation used across the app's content pages. */
export default function Navbar() {
  const { user, isAuthenticated, status, logout } = useAuth();
  const canSell = user?.role === 'seller' || user?.role === 'admin';

  const linkCls =
    'text-sm font-medium text-slate-600 transition-colors hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-ink-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-7">
          <Link to="/" className="group flex items-center gap-1.5 text-xl font-extrabold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-sm text-white shadow-glow transition-transform group-hover:scale-110">
              ⚡
            </span>
            <span className="gradient-text">BidStorm</span>
          </Link>
          <nav className="hidden gap-5 sm:flex">
            <Link to="/auctions" className={linkCls}>
              Browse
            </Link>
            {canSell && (
              <Link to="/dashboard" className={linkCls}>
                My auctions
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className={linkCls}>
                Admin
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
                  className="rounded-lg bg-brand-gradient bg-[length:200%_auto] px-3.5 py-1.5 font-medium text-white shadow-glow transition-all hover:bg-[position:100%_0]"
                >
                  + New auction
                </Link>
              )}
              <Link to="/profile" className={linkCls}>
                {user.username}
              </Link>
              <button
                onClick={() => void logout()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkCls}>
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-gradient bg-[length:200%_auto] px-3.5 py-1.5 font-medium text-white shadow-glow transition-all hover:bg-[position:100%_0]"
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
