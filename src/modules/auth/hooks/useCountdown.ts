import { useEffect, useState } from 'react';

export function useCountdown(deadlineMs: number | null): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (deadlineMs == null) {
      return;
    }

    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)));
    };

    const timeoutId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [deadlineMs]);

  return deadlineMs == null ? 0 : remaining;
}
