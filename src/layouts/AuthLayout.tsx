import { Box, Link, useTheme } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthIllustration } from '@/modules/auth/components/AuthIllustration';
import { AuthPhonePreview } from '@/modules/auth/components/AuthPhonePreview';
import { authSurfaces } from '@/modules/auth/theme/authUx';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { PUBLIC_SITE } from '@/shared/constants/publicSite';
import { SkipLink, MAIN_CONTENT_ID } from '@/shared/components/SkipLink';

type AuthLayoutProps = {
  children: ReactNode;
};

/**
 * Two-column auth shell. The page (html) is the only vertical scroller —
 * do not set overflow-x: hidden here; CSS would turn overflow-y into auto
 * and create a second scrollbar.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        minHeight: '100dvh',
        bgcolor: a.pageBg,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <SkipLink />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          bgcolor: isDark ? 'rgba(45, 212, 191, 0.08)' : '#D8F2E6',
          top: -260,
          left: -160,
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.1 : 0.22,
          backgroundImage: `radial-gradient(${a.border} 1.15px, transparent 1.15px)`,
          backgroundSize: '20px 20px',
          maskImage: 'linear-gradient(90deg, transparent 42%, #000 78%)',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: { xs: 14, md: 20 },
          left: { xs: 14, md: 28 },
          zIndex: 3,
        }}
      >
        <Link
          href={PUBLIC_SITE.home}
          underline="none"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            py: 0.75,
            borderRadius: 999,
            border: `1px solid ${a.border}`,
            bgcolor: isDark ? 'rgba(17, 24, 39, 0.72)' : 'rgba(255,255,255,0.88)',
            color: a.textSecondary,
            ...DASHBOARD_UX.caption,
            fontWeight: 700,
            backdropFilter: 'blur(8px)',
            transition: 'color 120ms ease, border-color 120ms ease, background-color 120ms ease',
            '&:hover': {
              color: a.textPrimary,
              borderColor: a.brand,
              bgcolor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#FFFFFF',
            },
          }}
        >
          <ArrowLeft size={14} strokeWidth={2.4} />
          {t('auth.backToWebsite', { defaultValue: 'Back to website' })}
        </Link>
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(0, 1.08fr) minmax(0, 0.92fr)',
          },
        }}
      >
        <AuthIllustration />
        <Box
          component="main"
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 3, md: 4, lg: 6 },
            py: { xs: 4, md: 5, lg: 6 },
            minHeight: { xs: '100dvh', md: '100%' },
            outline: 'none',
          }}
        >
          {children}
        </Box>
      </Box>
      <AuthPhonePreview />
    </Box>
  );
}
