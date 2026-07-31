import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { colors } from '@/shared/theme/colors';

type HealthScoreRingProps = {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
};

/** DOM/SVG port of mobile HealthScoreRing. */
export function HealthScoreRing({
  score,
  color,
  size = 56,
  strokeWidth = 5,
}: HealthScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

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
          stroke={colors.border}
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
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: size >= 72 ? 18 : size >= 56 ? 15 : size >= 52 ? 13 : 12,
            color,
            lineHeight: 1,
          }}
        >
          {`${clamped}%`}
        </Typography>
      </Box>
    </Box>
  );
}
