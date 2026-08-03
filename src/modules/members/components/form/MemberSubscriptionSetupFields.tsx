import { Box, TextField, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import type { PrepaidBalanceUnit } from '@/shared/types/member';

type MemberSubscriptionSetupFieldsProps = {
  unit: PrepaidBalanceUnit;
  mealQty: string;
  subscriptionPrice: string;
  validTill: string;
  onMealQtyChange: (value: string) => void;
  onSubscriptionPriceChange: (value: string) => void;
  onValidTillChange: (value: string) => void;
  mealQtyError?: string;
  subscriptionPriceError?: string;
  optionalHint?: boolean;
  useSubscriptionLabels?: boolean;
  disabled?: boolean;
};

/** Subscription pack fields — matches mobile MemberSubscriptionSetupFields. */
export function MemberSubscriptionSetupFields({
  unit,
  mealQty,
  subscriptionPrice,
  validTill,
  onMealQtyChange,
  onSubscriptionPriceChange,
  onValidTillChange,
  mealQtyError,
  subscriptionPriceError,
  optionalHint = false,
  useSubscriptionLabels = false,
  disabled,
}: MemberSubscriptionSetupFieldsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isMealsUnit = unit === 'MEALS';
  const mealLabel = useSubscriptionLabels
    ? t('meals.subscription.mealsIncludedLabel', { defaultValue: 'Meals included' })
    : t('members.subscriptionSetup.mealQtyLabel');

  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {t('members.subscriptionSetup.title')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.5 }}>
          {optionalHint
            ? t('members.subscriptionSetup.subtitleOptional')
            : t('members.subscriptionSetup.subtitle', {
                defaultValue:
                  'Record the first pack when adding this member. Meals are debited when they confirm poll choices.',
              })}
        </Typography>
      </Box>

      {isMealsUnit ? (
        <>
          <TextField
            label={mealLabel}
            value={mealQty}
            onChange={(e) => onMealQtyChange(e.target.value.replace(/[^\d]/g, ''))}
            error={Boolean(mealQtyError)}
            helperText={mealQtyError}
            placeholder={t('members.subscriptionSetup.mealQtyPlaceholder', {
              defaultValue: 'e.g. 30',
            })}
            fullWidth
            disabled={disabled}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
          <TextField
            label={t('members.subscriptionSetup.priceLabel')}
            value={subscriptionPrice}
            onChange={(e) => onSubscriptionPriceChange(e.target.value.replace(/[^\d.]/g, ''))}
            error={Boolean(subscriptionPriceError)}
            helperText={subscriptionPriceError}
            placeholder={t('members.subscriptionSetup.pricePlaceholder', {
              defaultValue: 'e.g. 3000',
            })}
            fullWidth
            disabled={disabled}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
          />
        </>
      ) : (
        <TextField
          label={t('members.subscriptionSetup.amountLabel', {
            defaultValue: 'Subscription amount (₹)',
          })}
          value={subscriptionPrice}
          onChange={(e) => onSubscriptionPriceChange(e.target.value.replace(/[^\d.]/g, ''))}
          error={Boolean(subscriptionPriceError)}
          helperText={subscriptionPriceError}
          placeholder={t('members.subscriptionSetup.amountPlaceholder', {
            defaultValue: 'e.g. 3000',
          })}
          fullWidth
          disabled={disabled}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        />
      )}

      <TextField
        label={t('meals.subscription.validTillLabel', { defaultValue: 'Valid till' })}
        type="date"
        value={validTill}
        onChange={(e) => onValidTillChange(e.target.value)}
        fullWidth
        disabled={disabled}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}
