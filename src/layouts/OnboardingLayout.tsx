import { AppBar, Box, Button, IconButton, Toolbar, Tooltip, Typography, useTheme } from '@mui/material';
import { Moon, Sun, Home, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { AUTH_UX, authSurfaces } from '@/modules/auth/theme/authUx';
import { LanguagePicker } from '@/modules/profile/components/LanguagePicker';
import { ROUTES } from '@/routes/paths';
import { SkipLink, MAIN_CONTENT_ID } from '@/shared/components/SkipLink';
import { colors } from '@/shared/theme/colors';
import { useAppStore } from '@/store/appStore';
import { LAYOUT } from './layoutConstants';

function resolveAppLanguage(raw: string | undefined): AppLanguage {
  const code = (raw?.split('-')[0] ?? 'en') as AppLanguage;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? code : 'en';
}

type OnboardingLayoutProps = {
  children: ReactNode;
  /** Centered header title, e.g. Create Space. */
  pageTitle?: string;
  /** Replaces logout with a cancel action for focused setup flows. */
  onCancel?: () => void;
  cancelLabel?: string;
  showLogout?: boolean;
  showUserName?: boolean;
  /** Adds a profile shortcut, for hub pages that sit outside the app shell. */
  showProfile?: boolean;
};

/** Full-viewport onboarding chrome: brand header only, no app sidebar. */
export function OnboardingLayout({
  children,
  pageTitle,
  onCancel,
  cancelLabel,
  showLogout = true,
  showUserName: _showUserName = true,
  showProfile = false,
}: OnboardingLayoutProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const logout = useLogout();
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleThemeMode = useAppStore((state) => state.toggleThemeMode);
  const currentLanguage = resolveAppLanguage(i18n.language);
  const themeLabel =
    themeMode === 'light'
      ? t('settings.profile.themeDark', { defaultValue: 'Switch to dark mode' })
      : t('settings.profile.themeLight', { defaultValue: 'Switch to light mode' });
  const cancelText = cancelLabel ?? t('common.cancel');
  const headerButtonSx = {
    ...AUTH_UX.button,
    minHeight: 36,
    height: 36,
    px: 2.25,
    borderRadius: 999,
    color: a.brand,
    borderColor: a.brand,
    bgcolor: a.surface,
    boxShadow: 'none',
    '&:hover': {
      borderColor: a.brandHover,
      bgcolor: a.brandSoft,
      boxShadow: 'none',
    },
  } as const;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: a.pageBg,
        color: a.textPrimary,
        overflowY: 'auto',
      }}
    >
      <SkipLink />
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: a.surface,
          color: a.textPrimary,
          borderBottom: `1px solid ${a.border}`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${LAYOUT.headerHeight}px !important`,
            height: { xs: 'auto', md: LAYOUT.headerHeight },
            py: { xs: 1, md: 0 },
            px: { xs: 2, md: 3.5 },
            gap: 1.5,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: '1 1 auto' }}>
            <Box
              aria-hidden
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: colors.primary,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Home size={16} strokeWidth={2.25} />
            </Box>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: a.textPrimary,
                lineHeight: 1.1,
              }}
            >
              {t('common.appName')}
            </Typography>
          </Box>
          {pageTitle ? (
            <Typography
              component="h1"
              noWrap
              sx={{
                display: { xs: 'none', sm: 'block' },
                justifySelf: 'center',
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: a.textPrimary,
                lineHeight: 1.2,
                px: 1,
                minWidth: 0,
                flex: '0 1 auto',
              }}
            >
              {pageTitle}
            </Typography>
          ) : null}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 1,
              minWidth: 0,
              flexWrap: 'wrap',
              ml: 'auto',
            }}
          >
            {onCancel ? (
              <Button variant="outlined" onClick={onCancel} sx={headerButtonSx}>
                {cancelText}
              </Button>
            ) : null}
            {showProfile ? (
              <Button
                variant="outlined"
                startIcon={<UserRound size={14} />}
                onClick={() => navigate(ROUTES.profile)}
                sx={headerButtonSx}
              >
                {t('navigation.profile')}
              </Button>
            ) : null}
            {showLogout ? (
              <Button variant="outlined" onClick={() => void logout()} sx={headerButtonSx}>
                {t('common.logout')}
              </Button>
            ) : null}
            <LanguagePicker value={currentLanguage} compact />
            <Tooltip title={themeLabel}>
              <IconButton
                onClick={toggleThemeMode}
                aria-label={themeLabel}
                size="small"
                sx={{
                  color: a.textSecondary,
                  width: 36,
                  height: 36,
                  border: `1px solid ${a.border}`,
                  bgcolor: a.surface,
                  '&:hover': { bgcolor: a.elevated },
                }}
              >
                {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        sx={{
          flex: 1,
          minHeight: 0,
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, md: 1.75 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
