import { Box, Stack, Typography, useTheme } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

export type CompactPageBannerProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  right?: ReactNode;
  accent?: string;
  soft?: string;
  border?: string;
  showDecor?: boolean;
};

/**
 * Compact horizontal page banner aligned with mobile CompactPageBanner / Rooms entry card.
 * Layout: [icon] title / subtitle … [optional right]
 */
export function CompactPageBanner({
  icon: Icon,
  title,
  subtitle,
  right,
  accent = colors.primaryDark,
  soft,
  border = `${colors.primary}33`,
  showDecor = true,
}: CompactPageBannerProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const background = soft ?? s.successTint;
  const a11yLabel = subtitle ? `${title}. ${subtitle}` : title;

  return (
    <Box
      role="banner"
      aria-label={a11yLabel}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 80,
        mb: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: `${DASHBOARD_UX.radius + 6}px`,
        border: `1px solid ${border}`,
        bgcolor: background,
        boxShadow: s.shadow,
      }}
    >
      {showDecor ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 96,
            height: 96,
            borderRadius: '50%',
            bgcolor: `${accent}1F`,
            top: -40,
            right: -28,
          }}
        />
      ) : null}
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          bgcolor: s.surface,
          border: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </Box>
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <Typography
          sx={{
            fontSize: 16,
            lineHeight: '20px',
            fontWeight: 700,
            color: accent,
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            sx={{
              fontSize: 12,
              lineHeight: '16px',
              color: s.textSecondary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {right ? (
        <Box sx={{ zIndex: 1, flexShrink: 0, maxWidth: '34%' }}>{right}</Box>
      ) : null}
    </Box>
  );
}
