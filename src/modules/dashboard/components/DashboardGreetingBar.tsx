import { Box, Button, Stack, Typography } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';
import { isGenericUserName } from '@/modules/onboarding/utils/profileCompletion';

type DashboardGreetingBarProps = {
  spaceName: string;
  greetingKey: 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening';
  onRefresh: () => void;
  userFullName?: string | null;
};

export function DashboardGreetingBar({
  spaceName,
  greetingKey,
  onRefresh,
  userFullName,
}: DashboardGreetingBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const firstName =
    !isGenericUserName(userFullName) ? userFullName?.trim().split(/\s+/)[0] ?? null : null;
  const greeting = t(`dashboard.owner.${greetingKey}`);
  const greetingLine = firstName
    ? t('dashboard.owner.greetingWithName', { greeting, name: firstName })
    : t('dashboard.owner.greetingPlain', { greeting });

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            ...DASHBOARD_UX.pageTitle,
            color: s.textPrimary,
            letterSpacing: '-0.015em',
          }}
        >
          {greetingLine}
        </Typography>
        <Typography
          sx={{
            ...DASHBOARD_UX.greetingSub,
            color: s.textSecondary,
            mt: 0.25,
          }}
          noWrap
        >
          {t('dashboard.owner.heroSubtitleForSpace', {
            defaultValue: "Here's your operations overview for {{spaceName}}",
            spaceName,
          })}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<RefreshCw size={DASHBOARD_UX.iconSize} />}
        onClick={onRefresh}
        aria-label={t('common.refresh')}
        sx={{
          flexShrink: 0,
          height: DASHBOARD_UX.buttonHeight,
          px: `${DASHBOARD_UX.buttonPx}px`,
          py: `${DASHBOARD_UX.buttonPy}px`,
          minHeight: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          ...DASHBOARD_UX.button,
          borderColor: 'primary.main',
          color: 'primary.dark',
          bgcolor: s.surface,
        }}
      >
        {t('common.refresh')}
      </Button>
    </Stack>
  );
}
