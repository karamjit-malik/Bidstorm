import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RecommendedCarousel from '../components/recommendation/RecommendedCarousel';
import TrendingSection from '../components/recommendation/TrendingSection';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4';

const EMAIL = 'hello@bidstorm.co';
const TYPE_TEXT = 'Glad you stopped in. Bids are moving fast. What are you here to win?';

const MARQUEE = [
  'Electronics', 'Collectibles', 'Fashion', 'Home & Garden', 'Sports',
  'Books & Media', 'Vehicles', 'Jewelry & Watches', 'Antiques', 'Gaming',
];

/** Reveals `text` one character at a time after `startDelay`, then reports done. */
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1" />
      <rect x="1.5" y="1.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Transparent nav overlaid on the video hero. */
function HeroNav() {
  const { user, isAuthenticated, status, logout } = useAuth();
  const canSell = user?.role === 'seller' || user?.role === 'admin';
  const link = 'text-[15px] text-black transition-opacity hover:opacity-60';
  const pill =
    'inline-flex items-center rounded-full border border-black bg-black px-4 py-1.5 text-[14px] text-white transition-colors hover:bg-transparent hover:text-black';

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-[22px] tracking-tight text-black sm:text-[26px]">BidStorm</span>
          <span className="select-none text-[24px] text-black sm:text-[28px]" style={{ letterSpacing: '-0.02em' }}>
            ✳︎
          </span>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          <Link to="/auctions" className={link}>Browse</Link>
          {canSell && <Link to="/dashboard" className={link}>My auctions</Link>}
          {user?.role === 'admin' && <Link to="/admin" className={link}>Admin</Link>}
        </nav>
        <nav className="flex items-center gap-4">
          {status === 'loading' ? (
            <span className="text-black/40">…</span>
          ) : isAuthenticated && user ? (
            <>
              <Link to="/profile" className={`${link} hidden sm:inline`}>{user.username}</Link>
              <button onClick={() => void logout()} className={pill}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className={`${link} underline underline-offset-2`}>Log in</Link>
              <Link to="/register" className={pill}>Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pillsVisible, setPillsVisible] = useState(false);
  const { displayed, done } = useTypewriter(TYPE_TEXT);

  useEffect(() => {
    const t = window.setTimeout(() => setPillsVisible(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  // Scrub the hero video with horizontal mouse movement (delta seek, onSeeked re-queue).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const SENSITIVITY = 0.8;
    let prevX = window.innerWidth / 2;
    let targetTime = 0;
    let seeking = false;

    const doSeek = () => {
      if (!video.duration) { seeking = false; return; }
      if (Math.abs(video.currentTime - targetTime) < 0.001) { seeking = false; return; }
      seeking = true;
      video.currentTime = targetTime;
    };
    const onMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      if (!video.duration) { prevX = currentX; return; }
      const delta = currentX - prevX;
      prevX = currentX;
      targetTime += (delta / window.innerWidth) * SENSITIVITY * video.duration;
      targetTime = Math.max(0, Math.min(video.duration, targetTime));
      if (!seeking) doSeek();
    };
    const onSeeked = () => doSeek();

    window.addEventListener('mousemove', onMove);
    video.addEventListener('seeked', onSeeked);
    return () => {
      window.removeEventListener('mousemove', onMove);
      video.removeEventListener('seeked', onSeeked);
    };
  }, []);

  const copyEmail = () => void navigator.clipboard?.writeText(EMAIL);

  const scrollToTrending = () =>
    document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' });

  const pillBase =
    'inline-flex items-center justify-center rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.35em] mx-[0.2em] mb-[0.4em] whitespace-nowrap transition-colors duration-200';
  const whitePill = `${pillBase} border border-black/10 bg-white text-black hover:bg-black hover:text-white`;

  return (
    <div className="bg-[#efedea] text-black">
      {/* ===== Hero (BidStorm brand, Mainframe style, scrub video) ===== */}
      <section className="relative flex h-screen flex-col justify-end overflow-hidden px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0">
        <video
          ref={videoRef}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={{ objectPosition: 'center', transform: 'scale(1.18) translateX(-8%)' }}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
        />
        {/* Left readability wash */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#efedea]/75 via-[#efedea]/20 to-transparent" />

        <HeroNav />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="max-w-xl">
            {/* Blurred intro label */}
            <div
              className="pointer-events-none mb-5 select-none sm:mb-6"
              style={{
                fontSize: 'clamp(18px, 4vw, 26px)',
                lineHeight: 1.3,
                fontWeight: 400,
                color: '#000',
                filter: 'blur(4px)',
              }}
            >
              Hey there, welcome to BidStorm,
              <br />
              real-time auctions, intelligently matched.
            </div>

            {/* Typewriter line */}
            <p
              className="mb-5 text-black sm:mb-6"
              style={{ fontSize: 'clamp(18px, 4vw, 26px)', lineHeight: 1.35, fontWeight: 400, minHeight: '54px' }}
            >
              {displayed}
              {!done && (
                <span className="cursor-blink ml-[2px] inline-block h-[1.1em] w-[2px] bg-black align-middle" />
              )}
            </p>

            {/* Action pills */}
            <div
              className="flex flex-wrap gap-y-1"
              style={{
                opacity: pillsVisible ? 1 : 0,
                transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              <Link to="/auctions" className={whitePill}>Browse auctions</Link>
              <Link to="/auctions/new" className={whitePill}>Sell an item</Link>
              <button type="button" onClick={scrollToTrending} className={whitePill}>
                See what&apos;s trending
              </button>
              {isAuthenticated && user ? (
                <Link to="/dashboard" className={whitePill}>My dashboard</Link>
              ) : (
                <Link to="/register" className={whitePill}>Get started</Link>
              )}

              <button
                type="button"
                onClick={copyEmail}
                className={`${pillBase} gap-2 border border-black bg-transparent text-black hover:bg-black hover:text-white sm:gap-3`}
              >
                <span>
                  Reach us: <span className="underline underline-offset-1">{EMAIL}</span>
                </span>
                <CopyIcon />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Category marquee ===== */}
      <div className="border-y border-black/10 bg-white py-4">
        <div className="edge-fade overflow-hidden">
          <div className="flex w-max animate-marquee gap-3">
            {[...MARQUEE, ...MARQUEE].map((c, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-black/10 px-4 py-1.5 text-sm text-black/60"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Personalized + trending ===== */}
      <main id="trending" className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <RecommendedCarousel />
        <TrendingSection />
      </main>

      <footer className="border-t border-black/10 py-10 text-center text-sm text-black/50">
        <span className="font-display text-black">BidStorm ✳︎</span> — real-time auctions, intelligently matched.
      </footer>
    </div>
  );
}
