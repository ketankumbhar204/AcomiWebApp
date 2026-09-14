import { Box, Stack, Typography, useTheme } from '@mui/material';
import { Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import {
  earliestOpenPollCloseAt,
  formatPollDeadline,
  formatPollRemaining,
  timezoneForPollClose,
  type PollCloseSource,
} from '../utils/pollCountdown';

type PollClosesInHintProps = {
  polls: PollCloseSource[];
};

export function PollClosesInHint({ polls }: PollClosesInHintProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const closeAt = useMemo(() => earliestOpenPollCloseAt(polls), [polls]);
  const timezone = useMemo(() => timezoneForPollClose(polls, closeAt), [closeAt, polls]);
  const remaining = closeAt ? formatPollRemaining(closeAt, t, nowMs, timezone) : null;
  const deadline = closeAt ? formatPollDeadline(closeAt, i18n.language, timezone) : null;

  if (!remaining) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{
        alignItems: 'center',
        minWidth: 0,
        justifyContent: { xs: 'flex-start', sm: 'center' },
        flexWrap: 'nowrap',
        px: 1,
        py: 0.45,
        borderRadius: 999,
        border: `1px solid ${colors.primary}55`,
        bgcolor: `${colors.primary}14`,
        animation: 'pollClosePulse 2.4s ease-in-out infinite',
        '@keyframes pollClosePulse': {
          '0%, 100%': {
            backgroundColor: `${colors.primary}14`,
            boxShadow: `0 0 0 0 ${colors.primary}00`,
          },
          '50%': {
            backgroundColor: `${colors.primary}38`,
            boxShadow: `0 0 0 4px ${colors.primary}22`,
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          bgcolor: `${colors.primary}28`,
        },
      }}
    >
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: `${colors.primary}28`,
          color: colors.primaryDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Clock3 size={12} />
      </Box>
      <Typography
        noWrap
        sx={{
          ...DASHBOARD_UX.smallCaption,
          color: s.textSecondary,
          lineHeight: 1.2,
          minWidth: 0,
        }}
        title={deadline ? `${remaining} · ${deadline}` : remaining}
      >
        {t('meals.poll.pollClosesIn', { defaultValue: 'Poll closes in' })}{' '}
        <Box component="span" sx={{ fontWeight: 700, color: colors.primaryDark, fontSize: 13 }}>
          {remaining}
        </Box>
        {deadline ? (
          <Box component="span" sx={{ color: s.textMuted }}>
            {' · '}
            {deadline}
          </Box>
        ) : null}
      </Typography>
    </Stack>
  );
}
