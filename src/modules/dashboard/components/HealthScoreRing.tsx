import { Box, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { DASHBOARD_UX } from '../theme/dashboardUx';

type HealthScoreRingProps = {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
};

/** Type that keeps "100%" inside compact dashboard rings (46px). */
function ringPercentSx(size: number, score: number) {
  const digits = score >= 100 ? 3 : score >= 10 ? 2 : 1;
  if (size >= 88) {
    return {
      ...DASHBOARD_UX.largeNumber,
      lineHeight: 1,
      whiteSpace: 'nowrap' as const,
      fontVariantNumeric: 'tabular-nums' as const,
    };
  }
  if (size >= 72) {
    return {
      ...DASHBOARD_UX.counterValue,
      lineHeight: 1,
      whiteSpace: 'nowrap' as const,
      fontVariantNumeric: 'tabular-nums' as const,
    };
  }
  const fontSize = digits >= 3 ? 10 : digits === 2 ? 11 : 12;
  return {
    fontSize,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: digits >= 3 ? '-0.04em' : '-0.02em',
    whiteSpace: 'nowrap' as const,
    fontVariantNumeric: 'tabular-nums' as const,
  };
}

/** DOM/SVG port of mobile HealthScoreRing. */
export function HealthScoreRing({
  score,
  color,
  size = 56,
  strokeWidth = 5,
}: HealthScoreRingProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const track = theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0';

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setOffset(circumference * (1 - clamped / 100));
    });
    return () => cancelAnimationFrame(id);
  }, [clamped, circumference]);

  return (
    <Box sx={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 750ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <Typography
          sx={{
            ...ringPercentSx(size, clamped),
            color,
          }}
        >
          {clamped}
          <Box
            component="span"
            sx={{
              fontSize: '0.68em',
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            %
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}
