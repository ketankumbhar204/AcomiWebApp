import { Box, Button, Link, Stack, Typography, useTheme } from '@mui/material';
import { Clock3, Info, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { SearchToolbar } from '@/shared/components/SearchToolbar';
import { colors } from '@/shared/theme/colors';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { MealType, MenuHistoryItemResponse } from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import {
  formatHistoryLastUsedLabel,
  filterHistoryForMealType,
  groupMenuHistoryItems,
} from '../utils/menuHistoryGroups';
import { MealPlanSelectableCard } from './mealPlanVisuals';

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
    <Stack spacing={1.5}>
      <SearchToolbar
        value={search}
        onChange={setSearch}
        placeholder={t('meals.planning.searchHistory')}
      />

      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          alignItems: 'flex-start',
          p: 1.5,
          borderRadius: `${DASHBOARD_UX.radius}px`,
          bgcolor: s.elevated,
          border: `1px solid ${s.border}`,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
            bgcolor: `${colors.primary}18`,
            color: colors.primaryDark,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Info size={16} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {t('meals.planning.historyHintModern', {
              meal: t(`meals.mealType.${mealType}`),
              defaultValue:
                'Suggestions are from {{meal}} only. Items used in other meals remain in their own history.',
            })}
          </Typography>
          {canManage && mealItems.length > 0 ? (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => void clearHistory()}
              sx={{ ...DASHBOARD_UX.link, color: colors.primaryDark, mt: 0.75, display: 'inline-block' }}
            >
              {t('meals.planning.clearHistory')}
            </Link>
          ) : null}
        </Box>
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
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mb: 1, fontWeight: 600 }}>
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
                const lastUsed = formatHistoryLastUsedLabel(item, formatDate, {
                  today: t('meals.planning.historyGroupToday'),
                  yesterday: t('meals.planning.historyGroupYesterday'),
                });
                const price =
                  needPrices && item.price != null && item.price > 0
                    ? formatCurrency(item.price, item.currencyCode ?? undefined)
                    : null;

                return (
                  <MealPlanSelectableCard
                    key={item.historyId}
                    selected={selected}
                    disabled={!canManage}
                    onToggle={() => {
                      if (item.type === 'COMBO') onToggleCombo(item);
                      else onToggleItem(item);
                    }}
                    name={item.name}
                    foodType={item.foodType}
                    subtitle={
                      item.summary ||
                      t(`meals.mealType.${mealType}`, { defaultValue: String(mealType) })
                    }
                    meta={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.35 }}>
                        <Clock3 size={12} color={s.textMuted} />
                        <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }} noWrap>
                          {t('meals.planning.historyUsedCount', { count: item.usageCount })}
                          {lastUsed ? ` · ${lastUsed}` : ''}
                        </Typography>
                      </Stack>
                    }
                    trailing={
                      price ? (
                        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                          {price}
                        </Typography>
                      ) : null
                    }
                  />
                );
              })}
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
}
