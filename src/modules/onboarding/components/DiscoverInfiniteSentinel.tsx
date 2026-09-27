import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';

type DiscoverInfiniteSentinelProps = {
  onVisible: () => void;
  disabled?: boolean;
};

export function DiscoverInfiniteSentinel({
  onVisible,
  disabled = false,
}: DiscoverInfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, onVisible]);

  return <Box ref={ref} aria-hidden sx={{ height: 32, width: '100%' }} />;
}
