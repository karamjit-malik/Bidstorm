import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/** Shared top navigation — Mainframe editorial style. */
export default function Navbar() {
  const { user, isAuthenticated, status, logout } = useAuth();
  const canSell = user?.role === 'seller' || user?.role === 'admin';

  const link = 'text-[15px] text-black transition-opacity hover:opacity-60';
  const pill =
    'inline-flex items-center rounded-full border border-black bg-black px-4 py-1.5 text-[14px] text-white transition-colors hover:bg-white hover:text-black';
  const pillOutline =
    'inline-flex items-center rounded-full border border-black/25 px-4 py-1.5 text-[14px] text-black transition-colors hover:border-black hover:bg-black hover:text-white';

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#efedea]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
            <span className="font-display text-[22px] tracking-tight text-black">BidStorm</span>
            <span className="select-none text-[24px] text-black" style={{ letterSpacing: '-0.02em' }}>
              ✳︎
            </span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link to="/auctions" className={link}>
              Browse
            </Link>
            {canSell && (
              <Link to="/dashboard" className={link}>
                My auctions
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className={link}>
                Admin
              </Link>
            )}
          </nav>
        </div>

        <nav className="flex items-center gap-4">
          {status === 'loading' ? (
            <span className="text-black/40">…</span>
          ) : isAuthenticated && user ? (
            <>
              {canSell && (
                <Link to="/auctions/new" className={pill}>
                  + New auction
                </Link>
              )}
              <Link to="/profile" className={`${link} hidden sm:inline`}>
                {user.username}
              </Link>
              <button onClick={() => void logout()} className={pillOutline}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`${link} underline underline-offset-2`}>
                Log in
              </Link>
              <Link to="/register" className={pill}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
