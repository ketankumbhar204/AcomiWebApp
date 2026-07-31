import { Box } from '@mui/material';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';

export type LayoutIllustrationSize =
  | 'building'
  | 'floor'
  | 'floorWide'
  | 'unit'
  | 'room'
  | 'bed'
  | 'bedHero'
  | 'picker';

type LayoutIllustrationProps = {
  src: string;
  alt?: string;
  size?: LayoutIllustrationSize;
  /** Prefer wide frame for panoramic assets (e.g. CORRIDOR_PG floor). */
  wide?: boolean;
};

const SIZES: Record<LayoutIllustrationSize, { width: string | number; height: number }> = {
  building: { width: '100%', height: 180 },
  // Full-width frame; image centered inside (apartment / square floor art)
  floor: { width: '100%', height: 120 },
  // Corridor panoramic — short full-bleed
  floorWide: { width: '100%', height: 72 },
  unit: { width: '100%', height: 110 },
  room: { width: '100%', height: 120 },
  bed: { width: '100%', height: 96 },
  bedHero: { width: '100%', height: 160 },
  picker: { width: '100%', height: 96 },
};

/**
 * Shared accommodation illustration frame — always centered in a full-width box.
 */
export function LayoutIllustration({
  src,
  alt = '',
  size = 'unit',
  wide = false,
}: LayoutIllustrationProps) {
  const resolved: LayoutIllustrationSize = wide && size === 'floor' ? 'floorWide' : size;
  const dim = SIZES[resolved];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
        minHeight: dim.height,
        mb:
          resolved === 'building' || resolved === 'bedHero'
            ? 1.5
            : resolved === 'floorWide'
              ? 0.5
              : 1,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        bgcolor:
          resolved === 'floorWide' || resolved === 'building' || resolved === 'floor'
            ? 'action.hover'
            : undefined,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          height: dim.height,
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
          margin: '0 auto',
        }}
      />
    </Box>
  );
}
