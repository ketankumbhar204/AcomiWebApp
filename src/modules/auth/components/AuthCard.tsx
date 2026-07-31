import { Box, Paper, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type AuthCardProps = {
  children: ReactNode;
};

/** Auth form card — Dashboard radius, border, shadow, padding. */
export function AuthCard({ children }: AuthCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 440,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        p: `${DASHBOARD_UX.sectionPadding + 4}px`,
        boxShadow: s.shadow,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: DASHBOARD_UX.iconWell + 10,
            height: DASHBOARD_UX.iconWell + 10,
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            bgcolor: colors.primaryDark,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
          aria-hidden
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>C</Typography>
        </Box>
        <Typography
          sx={{
            ...DASHBOARD_UX.sectionHeading,
            color: colors.primaryDark,
          }}
        >
          {t('common.appName')}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}
