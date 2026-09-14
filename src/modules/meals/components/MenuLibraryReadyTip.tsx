import { Alert, Button, Stack, Typography } from '@mui/material';
import { CalendarDays } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { spaceMealsPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';

function tipStorageKey(spaceId: string): string {
  return `acomi:menu-library-ready-tip:${spaceId}`;
}

type MenuLibraryReadyTipProps = {
  spaceId: string;
  visible: boolean;
};

/** First-visit tip: seeded library is enough to plan — edit or continue. */
export function MenuLibraryReadyTip({ spaceId, visible }: MenuLibraryReadyTipProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(tipStorageKey(spaceId)) === '1');
    } catch {
      setDismissed(false);
    }
  }, [spaceId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(tipStorageKey(spaceId), '1');
    } catch {
      /* ignore */
    }
  }, [spaceId]);

  if (!visible || dismissed) {
    return null;
  }

  return (
    <Alert
      severity="info"
      onClose={dismiss}
      sx={{
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        border: `1px solid ${colors.border}`,
        bgcolor: '#EAF8F2',
        alignItems: 'flex-start',
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <Stack spacing={1.25} sx={{ width: '100%', pr: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {t('meals.library.readyTipTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('meals.library.readyTipBody')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
          <Button
            variant="contained"
            size="small"
            startIcon={<CalendarDays size={16} />}
            onClick={() => {
              dismiss();
              navigate(spaceMealsPath(spaceId));
            }}
            sx={{
              minHeight: DASHBOARD_UX.buttonHeight,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {t('meals.library.readyTipContinue')}
          </Button>
          <Button
            size="small"
            onClick={dismiss}
            sx={{ minHeight: DASHBOARD_UX.buttonHeight }}
          >
            {t('meals.library.readyTipStay')}
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
