import { Box, Typography, useTheme } from '@mui/material';
import { Clock3, LayoutGrid, ShieldCheck, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ownerBuilding from '@/assets/onboarding/owner-building.png';
import ownerMeal from '@/assets/onboarding/owner-meal.png';
import { authSurfaces } from '@/modules/auth/theme/authUx';
import { colors } from '@/shared/theme/colors';

export function CreateSpaceLeftPanel() {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';

  const perks = [
    {
      Icon: LayoutGrid,
      color: colors.teal,
      bg: isDark ? 'rgba(18, 140, 126, 0.22)' : colors.lightGreen,
      title: t('onboarding.choice.perkAllInOne'),
      body: t('onboarding.choice.perkAllInOneBody'),
    },
    {
      Icon: Clock3,
      color: '#D97706',
      bg: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FFF4E5',
      title: t('onboarding.choice.perkSaveTime'),
      body: t('onboarding.choice.perkSaveTimeBody'),
    },
    {
      Icon: ShieldCheck,
      color: '#2563EB',
      bg: isDark ? 'rgba(37, 99, 235, 0.2)' : '#E8F0FF',
      title: t('onboarding.choice.perkSecure'),
      body: t('onboarding.choice.perkSecureBody'),
    },
    {
      Icon: UsersRound,
      color: '#7C3AED',
      bg: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF',
      title: t('onboarding.choice.perkOperators'),
      body: t('onboarding.choice.perkOperatorsBody'),
    },
  ];

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 2,
        p: { md: 2.25, lg: 2.5 },
        borderRadius: '20px',
        bgcolor: isDark ? a.elevated : '#E7F6F1',
        border: `1px solid ${isDark ? a.border : 'rgba(15, 118, 110, 0.12)'}`,
        minHeight: 0,
        height: '100%',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'relative',
          height: { md: 168, lg: 196 },
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: isDark ? a.surface : '#F4FBF8',
        }}
      >
        <Box
          component="img"
          src={ownerBuilding}
          alt=""
          sx={{
            position: 'absolute',
            left: 12,
            bottom: 0,
            height: '92%',
            width: '58%',
            objectFit: 'contain',
            objectPosition: 'left bottom',
            pointerEvents: 'none',
          }}
        />
        <Box
          component="img"
          src={ownerMeal}
          alt=""
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 88,
            height: 88,
            objectFit: 'cover',
            borderRadius: '16px',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.14)',
            pointerEvents: 'none',
          }}
        />
      </Box>

      <Typography
        sx={{
          fontSize: { md: '1.15rem', lg: '1.25rem' },
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.25,
          color: a.textPrimary,
        }}
      >
        {t('spaces.createSpace.wizard.panelTitle', {
          defaultValue: 'One place to run your property & meals',
        })}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {perks.map((perk) => (
          <Box key={perk.title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: perk.bg,
                color: perk.color,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <perk.Icon size={16} strokeWidth={2.2} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: a.textPrimary, lineHeight: 1.3 }}>
                {perk.title}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: a.textMuted, lineHeight: 1.4, mt: 0.15 }}>
                {perk.body}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
