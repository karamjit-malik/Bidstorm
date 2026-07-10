import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import RecommendedCarousel from '../components/recommendation/RecommendedCarousel';
import TrendingSection from '../components/recommendation/TrendingSection';

// The 3D scene pulls in three.js — keep it out of the initial bundle.
const HeroScene = lazy(() => import('../components/hero/HeroScene'));

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
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

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-ink-950 dark:text-slate-100">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        {/* Aurora / glow background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-brand-radial" />
          <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl dark:bg-brand-500/25" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate="show"
              className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/60 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"
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
              className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
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
              className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400"
            >
              BidStorm is a live auction platform with sub-second updates, fair
              anti-snipe timing, and recommendations tuned to what you actually want.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/auctions"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand-gradient bg-[length:200%_auto] px-6 py-3 font-semibold text-white shadow-glow transition-all hover:bg-[position:100%_0] hover:shadow-glow-lg"
              >
                Browse auctions
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              {isAuthenticated && user ? (
                <span className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                  Signed in as <span className="font-semibold">{user.fullName}</span> ·{' '}
                  <span className="capitalize text-brand-500">{user.role}</span>
                </span>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-6 py-3 font-semibold backdrop-blur transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-brand-500 dark:hover:text-brand-300"
                >
                  Get started free
                </Link>
              )}
            </motion.div>
          </div>

          {/* 3D scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-72 sm:h-96 lg:h-[30rem]"
          >
            <Suspense
              fallback={
                <div className="absolute inset-0 grid place-items-center">
                  <div className="h-48 w-48 animate-float rounded-full bg-brand-gradient opacity-70 blur-2xl" />
                </div>
              }
            >
              <HeroScene />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* ---------- Feature highlights ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-brand-500/40"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-xl shadow-glow">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Personalized + trending ---------- */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <RecommendedCarousel />
        <TrendingSection />
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800">
        <span className="font-semibold gradient-text">BidStorm</span> — real-time auctions, intelligently matched.
      </footer>
    </div>
  );
}
