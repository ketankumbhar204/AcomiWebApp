import { Box, useTheme } from '@mui/material';

/**
 * Bottom-left scene from the Figma crop: tree, three white buildings,
 * a wide lawn oval (not a full circle), and a cropped mint arc behind.
 */
export function AuthSceneBuildings() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const lawn = isDark ? '#1B3D34' : '#C9EBD8';
  const wall = isDark ? '#1F2937' : '#FFFFFF';
  const teal = isDark ? '#2DD4BF' : '#1F6B52';
  const canopy = isDark ? '#2F8F6A' : '#1F6B4A';
  const canopyMid = isDark ? '#277A5C' : '#2A7A54';
  const arc = isDark ? 'rgba(45, 212, 191, 0.1)' : '#D7F0E3';

  return (
    <Box
      aria-hidden
      sx={{
        display: { xs: 'none', md: 'block' },
        position: 'absolute',
        left: { md: 8, lg: 20 },
        bottom: 0,
        width: { md: 340, lg: 380 },
        height: { md: 168, lg: 188 },
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg viewBox="0 0 380 188" width="100%" height="100%" fill="none">
        {/* Cropped mint arc — only the top of a large circle, as a hill */}
        <ellipse cx="210" cy="210" rx="168" ry="92" fill={arc} />
        {/* Lawn is a wide flat oval, not a complete circle */}
        <ellipse cx="188" cy="176" rx="168" ry="16" fill={lawn} />

        {/* Tree: white trunk + three overlapping canopy circles */}
        <rect x="28" y="118" width="14" height="50" rx="7" fill={wall} />
        <circle cx="24" cy="108" r="20" fill={canopy} />
        <circle cx="46" cy="104" r="18" fill={canopyMid} />
        <circle cx="35" cy="90" r="16" fill={canopy} />

        {/* Left building — shortest, flat roof, 2×3 windows */}
        <rect x="78" y="92" width="58" height="78" fill={wall} />
        <rect x="88" y="102" width="10" height="10" fill={teal} />
        <rect x="106" y="102" width="10" height="10" fill={teal} />
        <rect x="88" y="118" width="10" height="10" fill={teal} />
        <rect x="106" y="118" width="10" height="10" fill={teal} />
        <rect x="88" y="134" width="10" height="10" fill={teal} />
        <rect x="106" y="134" width="10" height="10" fill={teal} />
        <rect x="100" y="152" width="14" height="18" fill={teal} />

        {/* Center building — tallest, gabled teal roof, 2×4 windows */}
        <path d="M142 44 L178 16 L214 44 Z" fill={teal} />
        <rect x="146" y="44" width="64" height="126" fill={wall} />
        <rect x="158" y="56" width="11" height="11" fill={teal} />
        <rect x="186" y="56" width="11" height="11" fill={teal} />
        <rect x="158" y="76" width="11" height="11" fill={teal} />
        <rect x="186" y="76" width="11" height="11" fill={teal} />
        <rect x="158" y="96" width="11" height="11" fill={teal} />
        <rect x="186" y="96" width="11" height="11" fill={teal} />
        <rect x="158" y="116" width="11" height="11" fill={teal} />
        <rect x="186" y="116" width="11" height="11" fill={teal} />
        <rect x="170" y="148" width="16" height="22" fill={teal} />

        {/* Right building — mid height, flat roof, 2×3 windows */}
        <rect x="220" y="86" width="58" height="84" fill={wall} />
        <rect x="230" y="96" width="10" height="10" fill={teal} />
        <rect x="248" y="96" width="10" height="10" fill={teal} />
        <rect x="230" y="112" width="10" height="10" fill={teal} />
        <rect x="248" y="112" width="10" height="10" fill={teal} />
        <rect x="230" y="128" width="10" height="10" fill={teal} />
        <rect x="248" y="128" width="10" height="10" fill={teal} />
        <rect x="242" y="152" width="14" height="18" fill={teal} />

        {/* Small bush */}
        <ellipse cx="302" cy="168" rx="16" ry="9" fill={canopy} />
      </svg>
    </Box>
  );
}
