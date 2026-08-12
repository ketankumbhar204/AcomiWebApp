import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { LoadingState } from '@/shared/components/LoadingState';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { DailyMenuResponse, MealType } from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import { useMealMutations } from '../hooks/useMeals';
import { addDaysIso, formatMenuDateLabel, MEAL_TYPES } from '../utils/mealDates';

type CopyPreviousMenuDialogProps = {
  open: boolean;
  spaceId: string;
  targetDate: string;
  preferredMealType: MealType;
  onClose: () => void;
  onCopied: () => void;
};

/** Rich copy-previous dialog — parity with mobile CopyPreviousMenuSheet. */
export function CopyPreviousMenuDialog({
  open,
  spaceId,
  targetDate,
  preferredMealType,
  onClose,
  onCopied,
}: CopyPreviousMenuDialogProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);

  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<Record<MealType, boolean>>({
    BREAKFAST: false,
    LUNCH: false,
    DINNER: false,
  });
  const [customDate, setCustomDate] = useState('');
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pendingForce, setPendingForce] = useState(false);
  const [busy, setBusy] = useState(false);

  const range = useQuery({
    queryKey: ['copy-previous-range', spaceId, targetDate],
    queryFn: () =>
      mealsApi.getDailyMenusRange(spaceId, addDaysIso(targetDate, -90), addDaysIso(targetDate, -1)),
    enabled: open,
  });

  const historyDates = useMemo(() => {
    const map = new Map<string, DailyMenuResponse[]>();
    for (const menu of range.data ?? []) {
      if (!menu.options?.length) continue;
      const list = map.get(menu.menuDate) ?? [];
      list.push(menu);
      map.set(menu.menuDate, list);
    }
    return Array.from(map.entries())
      .map(([date, menus]) => ({ date, menus }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [range.data]);

  const yesterday = addDaysIso(targetDate, -1);
  const sameDayLastWeek = addDaysIso(targetDate, -7);
  const lastPlanned = historyDates[0]?.date;

  const previewMenus = useMemo(() => {
    if (!previewDate) return [];
    return historyDates.find((h) => h.date === previewDate)?.menus ?? [];
  }, [historyDates, previewDate]);

  const openPreview = (date: string) => {
    setPreviewDate(date);
    const menus = historyDates.find((h) => h.date === date)?.menus ?? [];
    const next: Record<MealType, boolean> = {
      BREAKFAST: false,
      LUNCH: false,
      DINNER: false,
    };
    for (const m of menus) {
      if (m.options?.length) next[m.mealType] = m.mealType === preferredMealType || menus.length === 1;
    }
    if (!Object.values(next).some(Boolean)) {
      for (const m of menus) {
        if (m.options?.length) next[m.mealType] = true;
      }
    }
    setSelectedMeals(next);
  };

  const runCopy = async (_force: boolean) => {
    if (!previewDate) return;
    const types = MEAL_TYPES.filter((mt) => selectedMeals[mt]);
    if (types.length === 0) {
      enqueueSnackbar(t('meals.planning.copyFrom.selectMeal', { defaultValue: 'Select at least one meal.' }), {
        variant: 'warning',
      });
      return;
    }
    setBusy(true);
    try {
      for (const mealType of types) {
        await mutations.copyDailyMenu.mutateAsync({
          targetDate,
          mealType,
          sourceDate: previewDate,
        });
      }
      enqueueSnackbar(t('meals.planning.copyFrom.success', { defaultValue: 'Menu copied.' }), {
        variant: 'success',
      });
      onCopied();
      onClose();
    } catch {
      setConflictOpen(true);
      setPendingForce(true);
    } finally {
      setBusy(false);
    }
  };

  const runCopyForce = async () => {
    if (!previewDate) return;
    const types = MEAL_TYPES.filter((mt) => selectedMeals[mt]);
    setBusy(true);
    try {
      for (const mealType of types) {
        await mealsApi.copyDailyMenu(spaceId, targetDate, mealType, previewDate, { force: true });
      }
      enqueueSnackbar(t('meals.planning.copyFrom.success', { defaultValue: 'Menu copied.' }), {
        variant: 'success',
      });
      onCopied();
      onClose();
    } catch {
      enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const loadCustomDate = async () => {
    if (!customDate || customDate >= targetDate) {
      enqueueSnackbar(t('meals.planning.copyFrom.pastOnly', { defaultValue: 'Choose a date before the target day.' }), {
        variant: 'warning',
      });
      return;
    }
    try {
      const menus = await mealsApi.getDailyMenusByDate(spaceId, customDate);
      if (!menus.some((m) => m.options?.length)) {
        enqueueSnackbar(t('meals.planning.copyFrom.emptyDay', { defaultValue: 'No menus on that date.' }), {
          variant: 'info',
        });
        return;
      }
      // Temporarily inject into history for preview
      openPreview(customDate);
      // If date not in historyDates, seed preview from fetched menus
      setPreviewDate(customDate);
      const next: Record<MealType, boolean> = {
        BREAKFAST: false,
        LUNCH: false,
        DINNER: false,
      };
      for (const m of menus) {
        if (m.options?.length) next[m.mealType] = m.mealType === preferredMealType;
      }
      setSelectedMeals(next);
    } catch {
      enqueueSnackbar(t('meals.errors.loadFailed', { defaultValue: 'Could not load menus.' }), {
        variant: 'error',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
          {t('meals.planning.copyFrom.title', { defaultValue: 'Copy previous menu' })}
        </DialogTitle>
        <DialogContent dividers>
          {range.isLoading ? (
            <LoadingState />
          ) : !previewDate ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {historyDates.some((h) => h.date === yesterday) ? (
                  <Button size="small" onClick={() => openPreview(yesterday)} sx={dashOutlinedButtonSx}>
                    {t('meals.planning.copyFrom.yesterday', { defaultValue: 'Yesterday' })}
                  </Button>
                ) : null}
                {lastPlanned ? (
                  <Button size="small" onClick={() => openPreview(lastPlanned)} sx={dashOutlinedButtonSx}>
                    {t('meals.planning.copyFrom.lastPlanned', { defaultValue: 'Last planned' })}
                  </Button>
                ) : null}
                {historyDates.some((h) => h.date === sameDayLastWeek) ? (
                  <Button size="small" onClick={() => openPreview(sameDayLastWeek)} sx={dashOutlinedButtonSx}>
                    {t('meals.planning.copyFrom.sameDayLastWeek', { defaultValue: 'Same day last week' })}
                  </Button>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TextField
                  size="small"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  slotProps={{ htmlInput: { max: addDaysIso(targetDate, -1) } }}
                />
                <Button size="small" onClick={() => void loadCustomDate()} sx={dashOutlinedButtonSx}>
                  {t('meals.planning.copyFrom.chooseDate', { defaultValue: 'Choose date' })}
                </Button>
              </Stack>

              {historyDates.length === 0 ? (
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                  {t('meals.planning.copyFrom.empty', {
                    defaultValue: 'No previous menus found for this meal.',
                  })}
                </Typography>
              ) : (
                <List dense>
                  {historyDates.map(({ date, menus }) => (
                    <ListItemButton key={date} onClick={() => openPreview(date)}>
                      <ListItemText
                        primary={formatMenuDateLabel(date, i18n.language)}
                        secondary={menus
                          .filter((m) => m.options?.length)
                          .map((m) => t(`meals.mealType.${m.mealType}`))
                          .join(' · ')}
                        slotProps={{
                          primary: { sx: DASHBOARD_UX.cardTitle },
                          secondary: { sx: DASHBOARD_UX.metricCaption },
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Button size="small" onClick={() => setPreviewDate(null)} sx={dashOutlinedButtonSx}>
                {t('common.back', { defaultValue: 'Back' })}
              </Button>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {formatMenuDateLabel(previewDate, i18n.language)}
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  const next = { ...selectedMeals };
                  for (const m of previewMenus) {
                    if (m.options?.length) next[m.mealType] = true;
                  }
                  setSelectedMeals(next);
                }}
                sx={{ ...dashOutlinedButtonSx, alignSelf: 'flex-start' }}
              >
                {t('meals.planning.copyFrom.selectEntireDay', { defaultValue: 'Select entire day' })}
              </Button>
              {MEAL_TYPES.map((mt) => {
                const menu = previewMenus.find((m) => m.mealType === mt);
                const planned = Boolean(menu?.options?.length);
                return (
                  <FormControlLabel
                    key={mt}
                    disabled={!planned}
                    control={
                      <Checkbox
                        checked={selectedMeals[mt]}
                        onChange={(_, checked) =>
                          setSelectedMeals((prev) => ({ ...prev, [mt]: checked }))
                        }
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                          {t(`meals.mealType.${mt}`)}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                          {planned
                            ? t('meals.planning.selectedCount', { count: menu?.options.length ?? 0 })
                            : t('meals.planning.emptySlot')}
                        </Typography>
                      </Box>
                    }
                  />
                );
              })}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={busy} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
          {previewDate ? (
            <Button
              variant="contained"
              disabled={busy}
              onClick={() => void runCopy(false)}
              sx={dashContainedButtonSx}
            >
              {t('meals.planning.copyFrom.copySelected', { defaultValue: 'Copy selected meals' })}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog open={conflictOpen} onClose={() => setConflictOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle }}>
          {t('meals.planning.copyFrom.conflictTitle', { defaultValue: 'Replace existing menu?' })}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {t('meals.planning.copyFrom.conflictBody', {
              defaultValue: 'A menu already exists for this day. Replace and copy?',
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictOpen(false)} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            sx={{ ...dashContainedButtonSx, bgcolor: colors.primaryDark }}
            onClick={() => {
              setConflictOpen(false);
              if (pendingForce) void runCopyForce();
            }}
          >
            {t('meals.planning.copyFrom.replaceAndCopy', { defaultValue: 'Replace and copy' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
