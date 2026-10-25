import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot, MealType } from '@/shared/types/meals';
import { buildDashboardMealSlotRows } from '../utils/dashboardMealSlotDisplay';
import { MealOperationSlotCard } from './MealOperationSlotCard';

const CAPTION_DEFAULTS: Record<string, string> = {
  'meals.planning.cardHintEmpty': 'Plan menu',
  'meals.planning.cardHintDraft': 'Ready to share',
  'meals.planning.cardHintNeedsReshare': 'Share changes',
  'meals.planning.cardHintResponses': '{{responded}} / {{eligible}} responses',
  'meals.planning.cardHintShared': 'Shared with members',
  'meals.planning.cardHintPollClosed': 'Poll closed',
};

type MealSlotCardProps = {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  poll?: MealPollSlot | null;
  headcount?: number | null;
  /** Eligible members for this meal. Falls back to the day total when omitted. */
  eligibleCount?: number;
  canManage: boolean;
  /** Opens the menu editor for this meal. */
  onEdit: () => void;
  /** @deprecated Kept for call-site compatibility; secondary actions live in the editor. */
  onShare?: () => void;
  onPublish?: () => void;
  onOpenPoll?: () => void;
  onClosePoll?: () => void;
};

/**
 * Meals-planner Breakfast / Lunch / Dinner card.
 * Presentation is the Dashboard meal card; this wrapper only maps the day's menu state.
 */
export function MealSlotCard({
  mealType,
  menu,
  poll,
  eligibleCount = 0,
  canManage,
  onEdit,
}: MealSlotCardProps) {
  const { t } = useTranslation();
  const row = useMemo(() => {
    const rows = buildDashboardMealSlotRows(
      menu ? { [mealType]: menu } : {},
      poll ? { [mealType]: poll } : {},
      { [mealType]: eligibleCount },
      {},
      eligibleCount,
    );
    const row = rows.find((item) => item.mealType === mealType);
    if (!row) {
      throw new Error(`Missing meal slot row for ${mealType}`);
    }
    return row;
  }, [eligibleCount, mealType, menu, poll]);

  const caption = t(row.captionKey, {
    ...row.captionParams,
    defaultValue: CAPTION_DEFAULTS[row.captionKey] ?? row.captionKey,
  });

  return (
    <MealOperationSlotCard
      mealType={mealType}
      mealLabel={t(`meals.mealType.${mealType}`)}
      caption={caption}
      countPrimary={row.countPrimary}
      countUnit={
        row.countUnitKey
          ? t(row.countUnitKey, { defaultValue: 'responded' })
          : undefined
      }
      captionTone={row.captionTone}
      statusKind={row.statusKind}
      onPress={canManage ? onEdit : undefined}
    />
  );
}
