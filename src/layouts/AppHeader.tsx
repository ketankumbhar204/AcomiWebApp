import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography, useTheme } from '@mui/material';
import { Menu, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { useAppStore } from '@/store/appStore';
import { LAYOUT } from './layoutConstants';

type AppHeaderProps = {
  /** Primary left cluster (e.g. space selector). Anchors space context. */
  leading?: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  onMenuClick?: () => void;
};

export function AppHeader({
  leading,
  title,
  subtitle,
  actions,
  onMenuClick,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleThemeMode = useAppStore((state) => state.toggleThemeMode);
  const themeLabel =
    themeMode === 'light'
      ? t('settings.profile.themeDark', { defaultValue: 'Switch to dark mode' })
      : t('settings.profile.themeLight', { defaultValue: 'Switch to light mode' });

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
        zIndex: (z) => z.zIndex.appBar,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${LAYOUT.headerHeight}px !important`,
          height: LAYOUT.headerHeight,
          width: '100%',
          minWidth: 0,
          gap: { xs: 1, md: 2 },
          px: { xs: 1, sm: 1.5, md: 2 },
        }}
      >
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          aria-label={t('navigation.openMenu', { defaultValue: 'Open navigation' })}
        >
          <Menu size={20} />
        </IconButton>

        {leading ? (
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              maxWidth: { md: 420 },
            }}
          >
            {leading}
          </Box>
        ) : title || subtitle ? (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {title ? (
              <Typography sx={{ ...DASHBOARD_UX.spaceName, color: s.textPrimary }} noWrap>
                {title}
              </Typography>
            ) : null}
            {subtitle ? (
              <Typography sx={{ ...DASHBOARD_UX.spaceRole, color: s.textSecondary }} noWrap>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        ) : (
          <Box sx={{ flex: 1, minWidth: 0 }} />
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, md: 1 },
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          {actions}
          <Tooltip title={themeLabel}>
            <IconButton onClick={toggleThemeMode} aria-label={themeLabel}>
              {themeMode === 'light' ? (
                <Moon size={DASHBOARD_UX.iconSize} />
              ) : (
                <Sun size={DASHBOARD_UX.iconSize} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
