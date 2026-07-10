import { useEffect, useState } from 'react';

export interface Countdown {
  total: number; // ms remaining (clamped at 0)
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
}

function compute(target: number, offsetMs: number): Countdown {
  const now = Date.now() + offsetMs;
  const total = Math.max(0, target - now);
  const seconds = Math.floor(total / 1000) % 60;
  const minutes = Math.floor(total / 1000 / 60) % 60;
  const hours = Math.floor(total / 1000 / 60 / 60) % 24;
  const days = Math.floor(total / 1000 / 60 / 60 / 24);
  return { total, days, hours, minutes, seconds, ended: total <= 0 };
}

/**
 * Ticks every second toward `targetTime`, corrected by a server-time offset so
 * the displayed countdown stays aligned with the server (max ~1s drift).
 */
export function useCountdown(targetTime: string | null, offsetMs = 0): Countdown {
  const target = targetTime ? Date.parse(targetTime) : 0;
  const [countdown, setCountdown] = useState<Countdown>(() => compute(target, offsetMs));

  useEffect(() => {
    if (!targetTime) return;
    setCountdown(compute(target, offsetMs));
    const timer = setInterval(() => setCountdown(compute(target, offsetMs)), 1000);
    return () => clearInterval(timer);
  }, [target, offsetMs, targetTime]);

  return countdown;
}
