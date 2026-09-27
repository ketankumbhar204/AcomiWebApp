import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '@/shared/theme/colors';
import { DASHBOARD_UX } from '../theme/dashboardUx';

/** Public-website OccupancyCard chip tones. */
export const OCCUPANCY_CHIP_TONES = {
  occupied: { bg: '#E7F6EE', fg: '#0F6B4C' },
  vacant: { bg: '#E8F1FF', fg: '#2563EB' },
  reserved: { bg: '#FFF1E0', fg: '#D97706' },
  info: { bg: '#E8F1FF', fg: '#2563EB' },
  warning: { bg: '#FFF1E0', fg: '#B45309' },
} as const;

const OCCUPANCY_CHIP_TONES_DARK = {
  occupied: { bg: 'rgba(15, 107, 76, 0.22)', fg: '#6EE7B7' },
  vacant: { bg: 'rgba(37, 99, 235, 0.22)', fg: '#93C5FD' },
  reserved: { bg: 'rgba(217, 119, 6, 0.22)', fg: '#FBBF24' },
  info: { bg: 'rgba(37, 99, 235, 0.22)', fg: '#93C5FD' },
  warning: { bg: 'rgba(180, 83, 9, 0.22)', fg: '#FDBA74' },
} as const;

export type OccupancyChipTone = keyof typeof OCCUPANCY_CHIP_TONES;

export type OccupancyChipModel = {
  id: string;
  value: number;
  label: string;
  tone: OccupancyChipTone;
  onClick?: () => void;
  selected?: boolean;
};

type OccupancyDonutProps = {
  occupied: number;
  total: number;
  size?: number;
};

/** Same 72px ring as public OccupancyDonut — occupied count in the center. */
export function OccupancyDonut({ occupied, total, size = 72 }: OccupancyDonutProps) {
  const theme = useTheme();
  const stroke = 8;
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, occupied / total) : 0;
  const ring = theme.palette.mode === 'dark' ? '#6EE7B7' : '#0F6B4C';
  const track = theme.palette.mode === 'dark' ? '#334155' : '#E8F0EC';
  const digits = String(occupied).length;
  const fontSize = digits >= 4 ? 11 : digits >= 3 ? 13 : 15;

  return (
    <Box
      component="svg"
      viewBox="0 0 72 72"
      sx={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden
    >
      <circle cx="36" cy="36" r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={ring}
        strokeWidth={stroke}
        strokeDasharray={`${c * pct} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill={ring}
        fontFamily="inherit"
      >
        {occupied}
      </text>
    </Box>
  );
}

function OccupancyMiniChip({ chip, dark }: { chip: OccupancyChipModel; dark: boolean }) {
  const tone = dark ? OCCUPANCY_CHIP_TONES_DARK[chip.tone] : OCCUPANCY_CHIP_TONES[chip.tone];
  const clickable = typeof chip.onClick === 'function';

  return (
    <Box
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={chip.onClick}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                chip.onClick?.();
              }
            }
          : undefined
      }
      aria-label={`${chip.label}: ${chip.value}`}
      aria-pressed={clickable ? Boolean(chip.selected) : undefined}
      sx={{
        minWidth: 0,
        borderRadius: '12px',
        px: 0.75,
        py: 1,
        textAlign: 'center',
        bgcolor: tone.bg,
        color: tone.fg,
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: chip.selected ? `inset 0 0 0 2px ${colors.primary}` : undefined,
        transition: DASHBOARD_UX.transition,
        '&:hover': clickable ? { filter: 'brightness(0.97)' } : undefined,
        '&:focus-visible': clickable
          ? { outline: `2px solid ${colors.primary}`, outlineOffset: 2 }
          : undefined,
      }}
    >
      <Typography
        sx={{
          fontSize: '1.125rem',
          fontWeight: 600,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: 'inherit',
        }}
      >
        {chip.value}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: 10,
          lineHeight: 1.25,
          fontWeight: 500,
          opacity: 0.8,
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          color: 'inherit',
        }}
      >
        {chip.label}
      </Typography>
    </Box>
  );
}

type OccupancyStatusBoardProps = {
  occupied: number;
  total: number;
  statusChips: OccupancyChipModel[];
  extraChips?: OccupancyChipModel[];
  footer?: ReactNode;
};

/**
 * Public OccupancyCard layout: donut on row 1, Occupied / Vacant / Reserved on row 2.
 */
export function OccupancyStatusBoard({
  occupied,
  total,
  statusChips,
  extraChips,
  footer,
}: OccupancyStatusBoardProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        mt: 0.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        minWidth: 0,
      }}
    >
      <OccupancyDonut occupied={occupied} total={total} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1,
          width: '100%',
          minWidth: 0,
        }}
      >
        {statusChips.map((chip) => (
          <OccupancyMiniChip key={chip.id} chip={chip} dark={dark} />
        ))}
      </Box>
      {extraChips && extraChips.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(extraChips.length, 2)}, minmax(0, 1fr))`,
            gap: 1,
            width: '100%',
            minWidth: 0,
          }}
        >
          {extraChips.map((chip) => (
            <OccupancyMiniChip key={chip.id} chip={chip} dark={dark} />
          ))}
        </Box>
      ) : null}
      {footer}
    </Box>
  );
}
