import { Box, Typography, useTheme } from '@mui/material';
import { Building2, IndianRupee, Users, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { colors, darkColors } from '@/shared/theme/colors';
import { AUTH_UX, authSurfaces } from '../theme/authUx';
import { AuthBrandMark } from './AuthBrandMark';
import { AuthSceneBuildings } from './AuthSceneBuildings';

type Feature = {
  id: string;
  Icon: LucideIcon;
  well: string;
  accent: string;
  titleKey: string;
  bodyKey: string;
};

/** Left hero from the registration mock. Hidden below `md`. */
export function AuthIllustration() {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';

  const features: Feature[] = [
    {
      id: 'properties',
      Icon: Building2,
      well: isDark ? 'rgba(45, 212, 191, 0.22)' : colors.lightGreen,
      accent: isDark ? darkColors.teal : colors.teal,
      titleKey: 'auth.illustration.propertiesTitle',
      bodyKey: 'auth.illustration.propertiesBody',
    },
    {
      id: 'meals',
      Icon: UtensilsCrossed,
      well: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FFF1E0',
      accent: a.featureMeal,
      titleKey: 'auth.illustration.mealsTitle',
      bodyKey: 'auth.illustration.mealsBody',
    },
    {
      id: 'payments',
      Icon: IndianRupee,
      well: isDark ? 'rgba(37, 99, 235, 0.22)' : '#E8F0FF',
      accent: a.featurePay,
      titleKey: 'auth.illustration.paymentsTitle',
      bodyKey: 'auth.illustration.paymentsBody',
    },
    {
      id: 'communicate',
      Icon: Users,
      well: isDark ? 'rgba(124, 58, 237, 0.22)' : '#F3E8FF',
      accent: isDark ? '#C4B5FD' : '#7C3AED',
      titleKey: 'auth.illustration.communicateTitle',
      bodyKey: 'auth.illustration.communicateBody',
    },
  ];

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'flex-start',
        boxSizing: 'border-box',
        minHeight: '100%',
        px: { md: 5, lg: 7 },
        pt: { md: 6, lg: 7 },
        pb: { md: 22, lg: 24 },
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 440 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <AuthBrandMark size={36} />
          <Typography sx={{ ...AUTH_UX.brandName, color: a.brand, letterSpacing: '-0.02em' }}>
            {t('auth.login.brandPanelTitle')}
          </Typography>
        </Box>

        <Typography
          sx={{
            mt: 3.5,
            fontSize: { md: '2rem', lg: '2.25rem' },
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            color: a.textPrimary,
            maxWidth: 440,
          }}
        >
          {t('auth.illustration.headlineLead')}{' '}
          <Box
            component="span"
            sx={{
              color: a.brand,
              fontStyle: 'italic',
              fontWeight: 700,
              borderBottom: `3px solid ${isDark ? 'rgba(45, 212, 191, 0.45)' : '#9FE1C7'}`,
              pb: 0.15,
            }}
          >
            {t('auth.illustration.headlineEase')}
          </Box>
        </Typography>

        <Typography sx={{ ...AUTH_UX.support, color: a.textSecondary, mt: 1.75, maxWidth: 380 }}>
          {t('auth.illustration.support')}
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {features.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: item.well,
                  color: item.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <item.Icon size={16} strokeWidth={2.2} aria-hidden />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: a.textPrimary, lineHeight: 1.3 }}>
                  {t(item.titleKey)}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: a.textMuted, lineHeight: 1.4, mt: 0.25 }}>
                  {t(item.bodyKey)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <AuthSceneBuildings />
    </Box>
  );
}
