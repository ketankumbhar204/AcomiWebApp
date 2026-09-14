import { Box, Link, Paper, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PUBLIC_SITE } from '@/shared/constants/publicSite';
import { AUTH_UX, authSurfaces } from '../theme/authUx';
import { AuthBrandMark } from './AuthBrandMark';

type AuthCardProps = {
  children: ReactNode;
};

/** Auth form card — ACOMI A mark, restrained teal, compact padding. */
export function AuthCard({ children }: AuthCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: AUTH_UX.cardMaxWidth,
        borderRadius: `${AUTH_UX.cardRadius}px`,
        border: `1px solid ${a.border}`,
        bgcolor: a.surface,
        p: { xs: 2.75, sm: `${AUTH_UX.cardPadding}px` },
        boxShadow: a.shadow,
      }}
    >
      <Box
        component={Link}
        href={PUBLIC_SITE.home}
        underline="none"
        aria-label={t('auth.backToWebsite', { defaultValue: 'Back to website' })}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 2.25,
          color: 'inherit',
          '&:hover .auth-card-brand': { opacity: 0.85 },
        }}
      >
        <AuthBrandMark size={40} />
        <Typography
          className="auth-card-brand"
          sx={{
            ...AUTH_UX.brandName,
            fontSize: '1.375rem',
            color: a.brand,
            mt: 1,
            letterSpacing: '-0.02em',
            transition: 'opacity 120ms ease',
          }}
        >
          {t('common.appName')}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}
