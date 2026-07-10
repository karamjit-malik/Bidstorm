import { useEffect, useRef, useState } from 'react';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4';

const NAV_LINKS = ['Labs', 'Studio', 'Openings', 'Shop'];
const EMAIL = 'hello@mainframe.co';

const TYPE_TEXT =
  'Glad you stopped in. Good taste tends to find us. Now, what are we building?';

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

/** Two overlapping rectangles — the "copy" affordance. */
function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1" />
      <rect x="1.5" y="1.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function Mainframe() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(false);
  const { displayed, done } = useTypewriter(TYPE_TEXT);

  // Reveal the action pills 400ms after load, independent of the typewriter.
  useEffect(() => {
    const t = window.setTimeout(() => setPillsVisible(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  // Scrub the background video with horizontal mouse movement. Track prevX,
  // convert the delta to a time offset, clamp it, and seek — using an onSeeked
  // handler to queue the next seek only if the target has moved, which prevents
  // seek-flooding.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const SENSITIVITY = 0.8;
    let prevX = window.innerWidth / 2;
    let targetTime = 0;
    let seeking = false;

    const doSeek = () => {
      if (!video.duration) {
        seeking = false;
        return;
      }
      if (Math.abs(video.currentTime - targetTime) < 0.001) {
        seeking = false;
        return;
      }
      seeking = true;
      video.currentTime = targetTime;
    };

    const onMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      if (!video.duration) {
        prevX = currentX;
        return;
      }
      const delta = currentX - prevX;
      prevX = currentX;
      targetTime += (delta / window.innerWidth) * SENSITIVITY * video.duration;
      targetTime = Math.max(0, Math.min(video.duration, targetTime));
      if (!seeking) doSeek();
    };

    // Queue the next seek once the current one lands, avoiding seek-flooding.
    const onSeeked = () => doSeek();

    window.addEventListener('mousemove', onMove);
    video.addEventListener('seeked', onSeeked);
    return () => {
      window.removeEventListener('mousemove', onMove);
      video.removeEventListener('seeked', onSeeked);
    };
  }, []);

  const copyEmail = () => {
    void navigator.clipboard?.writeText(EMAIL);
  };

  const pillBase =
    'inline-flex items-center justify-center rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap transition-colors duration-200';

  return (
    // Body font (Helvetica Now) is scoped to this wrapper so it never leaks into
    // the rest of BidStorm. Neutral backdrop avoids a white flash before the
    // video paints.
    <div style={{ fontFamily: 'var(--font-body)' }} className="min-h-screen bg-[#c9c6c1]">
      {/* Background video (mouse-scrub controlled) */}
      <video
        ref={videoRef}
        className="fixed inset-0 z-0 h-full w-full object-cover"
        style={{ objectPosition: 'center', transform: 'scale(1.18) translateX(-8%)' }}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
      />

      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <span
            className="text-[21px] tracking-tight text-black sm:text-[26px]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Mainframe(R)
          </span>
          <span
            className="select-none text-[25px] text-black sm:text-[30px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            ✳︎
          </span>
        </div>

        <nav className="hidden text-[23px] text-black md:flex">
          {NAV_LINKS.map((link, i) => (
            <span key={link}>
              <a href="#" className="transition-opacity hover:opacity-60">
                {link}
              </a>
              {i < NAV_LINKS.length - 1 ? ', ' : ''}
            </span>
          ))}
        </nav>

        <a
          href="#"
          className="hidden text-[23px] text-black underline underline-offset-2 transition-opacity hover:opacity-60 md:inline"
        >
          Get in touch
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex flex-col gap-[5px] md:hidden"
        >
          <span
            className="h-[2px] w-6 bg-black transition-all duration-300"
            style={menuOpen ? { transform: 'translateY(7px) rotate(45deg)' } : undefined}
          />
          <span
            className="h-[2px] w-6 bg-black transition-all duration-300"
            style={menuOpen ? { opacity: 0 } : undefined}
          />
          <span
            className="h-[2px] w-6 bg-black transition-all duration-300"
            style={menuOpen ? { transform: 'translateY(-7px) rotate(-45deg)' } : undefined}
          />
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-[9] flex flex-col justify-center gap-8 bg-white/95 px-8 backdrop-blur-sm transition-opacity duration-300 md:hidden"
        style={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            onClick={() => setMenuOpen(false)}
            className="text-[32px] font-medium text-black"
          >
            {link}
          </a>
        ))}
        <a href="#" className="text-[32px] font-medium text-black underline underline-offset-2">
          Get in touch
        </a>
      </div>

      {/* Hero */}
      <section className="relative z-[1] flex h-screen flex-col justify-end overflow-hidden px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0">
        <div className="relative z-10 max-w-xl">
          {/* 1. Blurred intro label */}
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
            Hey there, meet A.R.I.A,
            <br />
            Mainframe&apos;s Adaptive Response Interface Agent
          </div>

          {/* 2. Typewriter text */}
          <p
            className="mb-5 text-black sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              fontWeight: 400,
              minHeight: '54px',
            }}
          >
            {displayed}
            {!done && (
              <span className="cursor-blink ml-[2px] inline-block h-[1.1em] w-[2px] bg-black align-middle" />
            )}
          </p>

          {/* 3. Action pill buttons */}
          <div
            className="flex flex-wrap gap-y-1"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            {['Pitch us an idea', 'Come work here', 'Send a brief hello', 'See how we operate'].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  className={`${pillBase} border border-black/10 bg-white text-black hover:bg-black hover:text-white`}
                >
                  {label}
                </button>
              )
            )}

            <button
              type="button"
              onClick={copyEmail}
              className={`${pillBase} gap-2 border border-white bg-transparent text-white hover:bg-white hover:text-black sm:gap-3`}
            >
              <span>
                Reach us: <span className="underline underline-offset-1">{EMAIL}</span>
              </span>
              <CopyIcon />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
