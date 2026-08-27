import { useEffect, useState } from 'react';

function secondsLeft(deadlineMs: number | null): number {
  if (deadlineMs == null) {
    return 0;
  }
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

export function useCountdown(deadlineMs: number | null): number {
  const [remaining, setRemaining] = useState(() => secondsLeft(deadlineMs));

  useEffect(() => {
    setRemaining(secondsLeft(deadlineMs));
    if (deadlineMs == null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const next = secondsLeft(deadlineMs);
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [deadlineMs]);

  return deadlineMs == null ? 0 : remaining;
}
