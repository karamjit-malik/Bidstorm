import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import RecommendedCarousel from '../components/recommendation/RecommendedCarousel';
import TrendingSection from '../components/recommendation/TrendingSection';

// The 3D scene pulls in three.js — keep it out of the initial bundle.
const HeroScene = lazy(() => import('../components/hero/HeroScene'));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.09 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const FEATURES = [
  {
    title: 'Sub-second bidding',
    body: 'A live WebSocket feed keeps every watcher in perfect sync — no refresh, no lag.',
    icon: '⚡',
  },
  {
    title: 'Anti-snipe protection',
    body: 'Last-second bids automatically extend the clock, so the highest bid always wins fairly.',
    icon: '🛡️',
  },
  {
    title: 'Picked for you',
    body: 'A hybrid recommendation engine surfaces the auctions you actually care about.',
    icon: '✨',
  },
];

const MARQUEE = [
  'Electronics', 'Collectibles', 'Fashion', 'Home & Garden', 'Sports',
  'Books & Media', 'Vehicles', 'Jewelry & Watches', 'Antiques', 'Gaming',
];

/** Transparent nav that overlays the dark cinematic hero. */
function HeroNav() {
  const { user, isAuthenticated, status, logout } = useAuth();
  const canSell = user?.role === 'seller' || user?.role === 'admin';
  const link = 'text-sm font-medium text-white/70 transition-colors hover:text-white';

  return (
    <header className="relative z-20 w-full">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link to="/" className="group flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-sm shadow-glow transition-transform group-hover:scale-110">
          ⚡
        </span>
        BidStorm
      </Link>
      <nav className="hidden items-center gap-7 sm:flex">
        <Link to="/auctions" className={link}>Browse</Link>
        {canSell && <Link to="/dashboard" className={link}>My auctions</Link>}
        {user?.role === 'admin' && <Link to="/admin" className={link}>Admin</Link>}
      </nav>
      <nav className="flex items-center gap-3 text-sm">
        {status === 'loading' ? (
          <span className="text-white/40">…</span>
        ) : isAuthenticated && user ? (
          <>
            <Link to="/profile" className={link}>{user.username}</Link>
            <button
              onClick={() => void logout()}
              className="rounded-lg border border-white/20 px-3.5 py-1.5 font-medium text-white/90 transition hover:bg-white/10"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={link}>Log in</Link>
            <Link
              to="/register"
              className="rounded-lg bg-white px-4 py-1.5 font-semibold text-ink-950 transition hover:bg-white/90"
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

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="bg-white text-slate-900 dark:bg-ink-950 dark:text-slate-100">
      {/* ================= CINEMATIC HERO (always dark) ================= */}
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-ink-950 text-white">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/25 blur-[120px]" />
          <div className="absolute right-10 top-24 h-80 w-80 rounded-full bg-accent-500/25 blur-[100px]" />
          <div className="absolute -left-10 bottom-20 h-80 w-80 rounded-full bg-brand-600/20 blur-[100px]" />
          <div className="absolute inset-0 bg-dots opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        </div>

        {/* 3D centerpiece — centred on mobile, pushed to the empty right on desktop */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[4%]">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-[42rem] w-full max-w-3xl translate-y-[-4%]"
          >
            <Suspense
              fallback={
                <div className="grid h-full place-items-center">
                  <div className="h-64 w-64 animate-float rounded-full bg-brand-gradient opacity-60 blur-3xl" />
                </div>
              }
            >
              <HeroScene />
            </Suspense>
          </motion.div>
        </div>

        {/* Left-side readability scrim + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 vignette" />

        <HeroNav />

        {/* Hero copy */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-40 pt-10">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="show"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent-500" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
            </span>
            Live auctions, updating in real time
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-7 max-w-3xl font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Bid in real time.
            <br />
            <span className="gradient-text-animate">Win what you love.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-xl text-lg text-white/60"
          >
            A live auction platform with sub-second updates, fair anti-snipe timing,
            and recommendations tuned to exactly what you want.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/auctions"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_auto] px-6 py-3.5 font-semibold text-white shadow-glow transition-all hover:bg-[position:100%_0] hover:shadow-glow-lg"
            >
              Browse auctions
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            {isAuthenticated && user ? (
              <span className="rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm backdrop-blur">
                Signed in as <span className="font-semibold">{user.fullName}</span> ·{' '}
                <span className="capitalize text-brand-300">{user.role}</span>
              </span>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white/90 backdrop-blur transition hover:border-white/40 hover:bg-white/5"
              >
                Get started free
              </Link>
            )}
          </motion.div>
        </div>

        {/* Giant wordmark */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden">
          <div className="select-none whitespace-nowrap text-center font-display text-[22vw] font-bold leading-none tracking-tighter text-outline">
            BIDSTORM
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
          <div className="flex flex-col items-center gap-1 text-white/40">
            <span className="text-[11px] uppercase tracking-widest">Scroll</span>
            <span className="animate-scroll-cue text-lg">↓</span>
          </div>
        </div>
      </section>

      {/* ================= Trending marquee ================= */}
      <div className="border-y border-slate-200 bg-white py-4 dark:border-white/10 dark:bg-ink-900">
        <div className="edge-fade overflow-hidden">
          <div className="flex w-max animate-marquee gap-3">
            {[...MARQUEE, ...MARQUEE].map((c, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 dark:border-white/10 dark:text-white/60"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================= Feature highlights ================= */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-xl shadow-glow">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= Personalized + trending ================= */}
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <RecommendedCarousel />
        <TrendingSection />
      </main>

      <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-white/10">
        <span className="font-display font-semibold gradient-text">BidStorm</span> — real-time auctions, intelligently matched.
      </footer>
    </div>
  );
}
