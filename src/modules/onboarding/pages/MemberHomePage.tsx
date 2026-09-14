import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { Building2, Search, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { PendingInvitationsPanel } from '@/modules/onboarding/components/PendingInvitationsPanel';
import { setAccountIntent } from '@/modules/onboarding/utils/accountIntent';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

/**
 * Unified member home: Find a place CTA + pending invitations.
 * /join-space redirects here. Members with spaces land on My Spaces.
 */
export function MemberHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mySpaces = useSpaceStore((state) => state.mySpaces);

  useEffect(() => {
    document.title = `${t('onboarding.memberHome.title')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    setAccountIntent('member');
  }, []);

  if (mySpaces.length > 0) {
    return <Navigate to={ROUTES.mySpaces} replace />;
  }

  const textPrimary = isDark ? theme.palette.text.primary : colors.textPrimary;
  const textSecondary = isDark ? theme.palette.text.secondary : colors.textSecondary;
  const border = isDark ? theme.palette.divider : colors.border;
  const surface = isDark ? theme.palette.background.paper : colors.surface;

  return (
    <Box
      sx={{
        flex: 1,
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3.5, md: 5 },
        backgroundImage: isDark
          ? 'none'
          : 'linear-gradient(160deg, #E8F8EF 0%, #F4F7F8 45%, #EEF6FF 100%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          <Sparkles size={18} color={colors.teal} />
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: colors.teal,
            }}
          >
            {t('onboarding.memberHome.eyebrow')}
          </Typography>
        </Stack>

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '1.85rem', sm: '2.35rem' },
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: textPrimary,
            lineHeight: 1.15,
          }}
        >
          {t('onboarding.memberHome.heading')}
        </Typography>
        <Typography
          sx={{
            mt: 1.25,
            fontSize: { xs: '0.98rem', sm: '1.05rem' },
            color: textSecondary,
            lineHeight: 1.55,
            maxWidth: 480,
          }}
        >
          {t('onboarding.memberHome.subtitle')}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Search size={16} />}
          onClick={() => navigate(ROUTES.findAPlace)}
          sx={{
            ...dashContainedButtonSx,
            mt: 2.75,
            minHeight: 48,
            px: 2.5,
            borderRadius: '12px',
            bgcolor: colors.primaryDark,
            '&:hover': { bgcolor: colors.primaryHover },
          }}
        >
          {t('onboarding.memberHome.findCta')}
        </Button>

        <Box
          sx={{
            mt: 3.5,
            p: { xs: 2, sm: 2.25 },
            borderRadius: '18px',
            border: `1px solid ${border}`,
            bgcolor: surface,
          }}
        >
          <PendingInvitationsPanel compactEmpty />
        </Box>

        <Button
          variant="text"
          startIcon={<Building2 size={16} />}
          onClick={() => {
            setAccountIntent('owner');
            navigate(ROUTES.onboarding);
          }}
          sx={{
            ...dashOutlinedButtonSx,
            mt: 2.5,
            display: 'inline-flex',
            border: 'none',
            color: textSecondary,
            '&:hover': { bgcolor: colors.mintSubtle, color: colors.teal },
          }}
        >
          {t('onboarding.memberHome.ownerSwitch')}
        </Button>
      </Box>
    </Box>
  );
}
