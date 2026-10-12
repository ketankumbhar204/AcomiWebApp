import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { MealType } from '@/shared/types/meals';
import { colors } from '@/shared/theme/colors';
import { mealTypeTheme } from '../utils/mealTypeTheme';

export type MealChoiceCardModel = {
  mealType: MealType;
  plates: number;
  selected: boolean;
};

type MealChoiceCardsProps = {
  rows: MealChoiceCardModel[];
};

/** Breakfast, Lunch, and Dinner as one equal row. Long labels truncate instead of wrapping the row. */
export function MealChoiceCards({ rows }: MealChoiceCardsProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 0.75,
        width: '100%',
        minWidth: 0,
      }}
    >
      {rows.map((row) => {
        const theme = mealTypeTheme(row.mealType);
        const statusLabel = row.selected
          ? t('meals.poll.tabSelected', { defaultValue: 'Selected' })
          : t('meals.poll.tabNotSelected', { defaultValue: 'Not selected' });
        return (
          <Box
            key={row.mealType}
            sx={{
              minWidth: 0,
              px: 1,
              py: 0.75,
              borderRadius: 1.5,
              border: `1px solid ${theme.border}`,
              bgcolor: theme.soft,
            }}
          >
            <Typography
              noWrap
              title={t(`meals.mealType.${row.mealType}`)}
              sx={{ color: theme.accent, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}
            >
              {t(`meals.mealType.${row.mealType}`)}
            </Typography>
            <Typography sx={{ color: theme.accent, fontWeight: 700, fontSize: 16, lineHeight: 1.25 }}>
              {row.plates}
            </Typography>
            <Typography
              noWrap
              sx={{
                fontSize: 11,
                lineHeight: 1.2,
                fontWeight: row.selected ? 600 : 500,
                color: row.selected ? colors.success : colors.textSecondary,
              }}
            >
              {statusLabel}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
