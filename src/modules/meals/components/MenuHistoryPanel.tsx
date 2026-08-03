import { Box, Button, Checkbox, InputAdornment, Link, Stack, TextField, Typography, useTheme } from '@mui/material';
import { Clock3, Search, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { MealType, MenuHistoryItemResponse } from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import {
  formatHistoryLastUsedLabel,
  filterHistoryForMealType,
  groupMenuHistoryItems,
} from '../utils/menuHistoryGroups';

type MenuHistoryPanelProps = {
  spaceId: string;
  mealType: MealType;
  canManage: boolean;
  needPrices: boolean;
  selectedComboIds: Set<string>;
  selectedItemIds: Set<string>;
  onToggleCombo: (item: MenuHistoryItemResponse) => void;
  onToggleItem: (item: MenuHistoryItemResponse) => void;
  onBrowseCombos: () => void;
  onBrowseItems: () => void;
};

function foodTypeTone(foodType?: string | null): 'success' | 'warning' | 'info' | 'neutral' {
  if (foodType === 'VEG') return 'success';
  if (foodType === 'EGG') return 'warning';
  if (foodType === 'NON_VEG') return 'info';
  return 'neutral';
}

export function MenuHistoryPanel({
  spaceId,
  mealType,
  canManage,
  needPrices,
  selectedComboIds,
  selectedItemIds,
  onToggleCombo,
  onToggleItem,
  onBrowseCombos,
  onBrowseItems,
}: MenuHistoryPanelProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MenuHistoryItemResponse[]>([]);

  useEffect(() => {
    let active = true;
    setItems([]);
    setLoading(true);
    const timer = setTimeout(() => {
      void mealsApi
        .getMenuHistory(spaceId, mealType, { search: search.trim() || undefined, page: 0, size: 100 })
        .then((page) => {
          if (!active) return;
          setItems(filterHistoryForMealType(page.items ?? [], mealType));
        })
        .catch(() => {
          if (!active) return;
          setItems([]);
          enqueueSnackbar(
            t('meals.planning.historyLoadFailed', {
              defaultValue: 'Could not load menu history. Try again after refreshing.',
            }),
            { variant: 'warning' },
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enqueueSnackbar, mealType, search, spaceId, t]);

  const mealItems = useMemo(
    () => filterHistoryForMealType(items, mealType),
    [items, mealType],
  );
  const groups = useMemo(() => groupMenuHistoryItems(mealItems), [mealItems]);

  const clearHistory = async () => {
    try {
      await mealsApi.clearMenuHistory(spaceId, mealType);
      setItems([]);
      enqueueSnackbar(t('meals.planning.historyCleared'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('meals.errors.actionFailed', { defaultValue: 'Action failed' }), {
        variant: 'error',
      });
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Stack spacing={1.25}>
      <TextField
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('meals.planning.searchHistory')}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color={s.textMuted} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          p: 1.25,
          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
          bgcolor: s.elevated,
          border: `1px solid ${s.border}`,
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, flex: 1 }}>
          {t('meals.planning.historyHint', { meal: t(`meals.mealType.${mealType}`) })}
        </Typography>
        {canManage && mealItems.length > 0 ? (
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => void clearHistory()}
            sx={{ ...DASHBOARD_UX.link, color: colors.primaryDark, whiteSpace: 'nowrap' }}
          >
            {t('meals.planning.clearHistory')}
          </Link>
        ) : null}
      </Box>

      {mealItems.length === 0 ? (
        <EmptyState
          title={t('meals.planning.historyEmpty', { meal: t(`meals.mealType.${mealType}`) })}
          icon={<UtensilsCrossed size={28} />}
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={onBrowseCombos} sx={{ ...DASHBOARD_UX.button }}>
                {t('meals.planning.browseCombos')}
              </Button>
              <Button size="small" onClick={onBrowseItems} sx={{ ...DASHBOARD_UX.button }}>
                {t('meals.planning.browseItems')}
              </Button>
            </Stack>
          }
        />
      ) : (
        groups.map((group) => (
          <Box key={group.key}>
            <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, mb: 1 }}>
              {group.key === 'today'
                ? t('meals.planning.historyGroupToday')
                : group.key === 'yesterday'
                  ? t('meals.planning.historyGroupYesterday')
                  : group.key === 'last7Days'
                    ? t('meals.planning.historyGroupLast7Days')
                    : t('meals.planning.historyGroupOlder')}
            </Typography>
            <Stack spacing={1}>
              {group.items.map((item) => {
                const selected =
                  (item.type === 'COMBO' && !!item.comboId && selectedComboIds.has(item.comboId)) ||
                  (item.type === 'ITEM' && !!item.itemId && selectedItemIds.has(item.itemId));
                const lastUsed = formatHistoryLastUsedLabel(
                  item,
                  formatDate,
                  {
                    today: t('meals.planning.historyGroupToday'),
                    yesterday: t('meals.planning.historyGroupYesterday'),
                  },
                );
                return (
                  <Box
                    key={item.historyId}
                    component="button"
                    type="button"
                    disabled={!canManage}
                    onClick={() => {
                      if (item.type === 'COMBO') onToggleCombo(item);
                      else onToggleItem(item);
                    }}
                    sx={{
                      all: 'unset',
                      cursor: canManage ? 'pointer' : 'default',
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      p: 1.25,
                      borderRadius: `${DASHBOARD_UX.radius}px`,
                      border: `1px solid ${selected ? colors.primary : s.border}`,
                      bgcolor: selected ? `${colors.primary}14` : s.surface,
                    }}
                  >
                    <Checkbox checked={selected} tabIndex={-1} disableRipple sx={{ p: 0.5 }} />
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                        bgcolor: s.elevated,
                        color: colors.primaryDark,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <UtensilsCrossed size={18} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
                          {item.name}
                        </Typography>
                        {item.foodType ? (
                          <StatusChip
                            label={t(`meals.foodType.${item.foodType}`)}
                            tone={foodTypeTone(item.foodType)}
                          />
                        ) : null}
                      </Stack>
                      {item.summary ? (
                        <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
                          {item.summary}
                        </Typography>
                      ) : null}
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.35 }}>
                        <Clock3 size={12} color={s.textMuted} />
                        <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
                          {t('meals.planning.historyUsedCount', { count: item.usageCount })} · {lastUsed}
                        </Typography>
                      </Stack>
                    </Box>
                    {needPrices && item.price != null && item.price > 0 ? (
                      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, flexShrink: 0 }}>
                        {formatCurrency(item.price, item.currencyCode ?? undefined)}
                      </Typography>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
}
