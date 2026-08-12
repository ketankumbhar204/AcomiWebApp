import { Box, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import { CalendarDays, CheckCheck, Moon, Sun, Sunrise, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { DailyMenuResponse, MealComboResponse, MealType } from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import { getMenuOptionItemNames } from '../utils/plannedComboDisplay';
import { hasAvailableMenuOptions } from '../utils/shareMenuSelection';

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
};

const MEAL_ACCENTS: Record<MealType, string> = {
  BREAKFAST: '#D97706',
  LUNCH: colors.primaryDark,
  DINNER: '#7C3AED',
};

type PreviewOption = {
  index: number;
  title: string;
  details?: string;
};

type PreviewSection = {
  mealType: MealType;
  options: PreviewOption[];
  placeholder?: string;
};

type ShareMessagePreviewBubbleProps = {
  spaceId: string;
  spaceName: string;
  menuDate: string;
  selectedTypes: MealType[];
  menuMap: Partial<Record<MealType, DailyMenuResponse>>;
  loading?: boolean;
};

function formatPrice(price?: number | null, currencyCode?: string | null): string | null {
  if (price == null || Number.isNaN(Number(price))) {
    return null;
  }
  const amount = Number(price)
    .toFixed(2)
    .replace(/\.?0+$/, '');
  const code = currencyCode?.trim() || 'INR';
  if (code.toUpperCase() === 'INR') {
    return `₹${amount}`;
  }
  return `${code} ${amount}`;
}

function inferEntryType(
  option: NonNullable<DailyMenuResponse['options']>[number],
): 'COMBO' | 'ITEM' | 'PACKAGE' {
  if (option.entryType === 'COMBO' || option.entryType === 'ITEM' || option.entryType === 'PACKAGE') {
    return option.entryType;
  }
  if (option.comboId) return 'COMBO';
  if (option.itemId) return 'ITEM';
  return 'PACKAGE';
}

function buildSections(
  selectedTypes: MealType[],
  menuMap: Partial<Record<MealType, DailyMenuResponse>>,
  comboById: Map<string, MealComboResponse>,
  notAvailableLabel: (meal: string) => string,
  soonLabel: string,
): PreviewSection[] {
  return selectedTypes.map((mealType) => {
    const menu = menuMap[mealType];
    if (!menu || !hasAvailableMenuOptions(menu)) {
      return { mealType, options: [], placeholder: soonLabel };
    }

    const available = [...(menu.options ?? [])]
      .filter((o) => o.isAvailable)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const options: PreviewOption[] = [];
    let index = 1;
    for (const option of available) {
      const entryType = inferEntryType(option);
      const combo = option.comboId ? comboById.get(option.comboId) : undefined;
      const price =
        entryType === 'COMBO' ? (option.price ?? combo?.price ?? null) : (option.price ?? null);
      const currencyCode =
        entryType === 'COMBO'
          ? (option.currencyCode ?? combo?.currencyCode ?? null)
          : (option.currencyCode ?? null);
      const priced = formatPrice(price, currencyCode);
      const title = `${index}. ${option.label}${priced ? ` - ${priced}` : ''}`;
      let details: string | undefined;
      if (entryType === 'COMBO' || entryType === 'PACKAGE') {
        const names = getMenuOptionItemNames(option, comboById);
        if (names.length > 0) {
          details = names.join(', ');
        }
      }
      options.push({ index, title, details });
      index += 1;
    }
    options.push({
      index,
      title: `${index}. ${notAvailableLabel(mealType)}`,
    });

    return { mealType, options };
  });
}

function formatLongDate(isoDate: string, locale?: string): string {
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function formatNowTime(locale?: string): string {
  try {
    return new Date().toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/** WhatsApp-style share message preview — matches design mock. */
export function ShareMessagePreviewBubble({
  spaceId,
  spaceName,
  menuDate,
  selectedTypes,
  menuMap,
  loading = false,
}: ShareMessagePreviewBubbleProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const combosQuery = useQuery({
    queryKey: ['meal-combos', spaceId],
    queryFn: () => mealsApi.getMealCombos(spaceId),
    enabled: Boolean(spaceId) && selectedTypes.length > 0,
    staleTime: 60_000,
  });

  const comboById = useMemo(() => {
    const map = new Map<string, MealComboResponse>();
    for (const combo of combosQuery.data ?? []) {
      map.set(combo.comboId, combo);
    }
    return map;
  }, [combosQuery.data]);

  const sections = useMemo(
    () =>
      buildSections(
        selectedTypes,
        menuMap,
        comboById,
        (mealType) =>
          t('meals.planning.shareNotAvailableOption', {
            meal: t(`meals.mealType.${mealType}`),
            defaultValue: `Not available for ${t(`meals.mealType.${mealType}`)}`,
          }),
        t('meals.share.willUpdateSoon', { defaultValue: 'Will be updated soon' }),
      ),
    [comboById, menuMap, selectedTypes, t],
  );

  const showLoading = loading || (combosQuery.isLoading && selectedTypes.length > 0);

  if (selectedTypes.length === 0) {
    return (
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
        {t('meals.planning.shareSelectAtLeastOne')}
      </Typography>
    );
  }

  if (showLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '18px 18px 18px 4px',
        bgcolor: '#DCEFE3',
        border: `1px solid ${s.border}`,
        boxShadow: '0 8px 24px rgba(16, 24, 40, 0.08)',
        overflow: 'hidden',
        p: 1.5,
        // Subtle food-icon watermark pattern
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'><g fill='none' stroke='%23128C7E' stroke-width='1.2' opacity='0.07'><path d='M22 18v20M18 22h8M22 38c0 6 4 10 4 10M58 20c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10zM58 40v16'/></g></svg>`,
        )}")`,
        backgroundSize: '84px 84px',
      }}
    >
      {/* Bubble tip */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: 10,
          bottom: -7,
          width: 14,
          height: 14,
          bgcolor: '#DCEFE3',
          borderRight: `1px solid ${s.border}`,
          borderBottom: `1px solid ${s.border}`,
          transform: 'rotate(45deg)',
          zIndex: 0,
        }}
      />

      {/* Header: space + date */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 1.25, position: 'relative', zIndex: 1, alignItems: 'center' }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: colors.primaryDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <UtensilsCrossed size={15} color="#fff" strokeWidth={2.2} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
            {spaceName}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <CalendarDays size={12} color={s.textMuted} />
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
              {formatLongDate(menuDate, i18n.language)}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* White inner card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          bgcolor: '#FFFFFF',
          borderRadius: '12px',
          border: `1px solid ${s.border}`,
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
          p: 1.5,
        }}
      >
        <Stack spacing={1.75}>
          {sections.map((section) => {
            const Icon = MEAL_ICONS[section.mealType];
            const accent = MEAL_ACCENTS[section.mealType];
            return (
              <Box key={section.mealType}>
                <Stack direction="row" spacing={0.75} sx={{ mb: 0.75, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '6px',
                      bgcolor: `${accent}18`,
                      color: accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={13} strokeWidth={2.4} />
                  </Box>
                  <Typography sx={{ ...DASHBOARD_UX.link, color: accent, letterSpacing: 0.1 }}>
                    {t(`meals.mealType.${section.mealType}`)}
                  </Typography>
                </Stack>

                {section.placeholder ? (
                  <Stack direction="row" spacing={0.75} sx={{ pl: 0.25, alignItems: 'baseline' }}>
                    <Typography sx={{ ...DASHBOARD_UX.link, color: s.textMuted }}>–</Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, fontStyle: 'italic' }}>
                      {section.placeholder}
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={0.85}>
                    {section.options.map((option) => (
                      <Box key={`${section.mealType}-${option.index}`}>
                        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                          {option.title}
                        </Typography>
                        {option.details ? (
                          <Typography
                            sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.15, pl: 0.15 }}
                          >
                            {option.details}
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* WhatsApp-style footer */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          mt: 0.85,
          position: 'relative',
          zIndex: 1,
          pr: 0.25,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
          {formatNowTime(i18n.language)}
        </Typography>
        <CheckCheck size={14} color={colors.primaryDark} strokeWidth={2.4} />
      </Stack>
    </Box>
  );
}
